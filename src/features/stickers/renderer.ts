import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { StickerArt } from "./art";

/**
 * Draws every sticker on the page in 3D – one canvas over the whole screen,
 * clicks go through it. Each sticker stays a DOM box in its place (it is
 * dragged, laid out and animated there); every frame the renderer reads
 * where the box is and puts the sticker there: a thin piece of vinyl with
 * a rounded white rim, glossy, its shadow on the slide below. It leans
 * towards the pointer, wobbles when thrown, lifts when held – and is drawn
 * again only when any of that changes.
 */

/** Where a sticker's box is now – screen px, its picture's width, degrees. */
export type StickerPose = {
  x: number;
  y: number;
  width: number;
  rotation: number;
  /** 0 resting, 1 under the pointer, 2 held. */
  lift: number;
};

type Spring = { value: number; velocity: number; target: number };

const spring = (value = 0): Spring => ({ value, velocity: 0, target: value });

/** Still on its way – worth another frame. */
const moving = (s: Spring) =>
  Math.abs(s.velocity) > 1e-3 || Math.abs(s.target - s.value) > 1e-3;

const step = (s: Spring, dt: number, stiffness = 140, damping = 13) => {
  s.velocity += (stiffness * (s.target - s.value) - damping * s.velocity) * dt;
  s.value += s.velocity * dt;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** The vinyl's thickness and its rounded edge, as shares of the width. */
const DEPTH = 0.012;
const BEVEL = 0.012;
const MAX_LEAN = 0.42;
const FOV = 14;

type Built = {
  geometry: THREE.ExtrudeGeometry;
  face: THREE.MeshPhysicalMaterial;
  shadow: THREE.MeshBasicMaterial;
  aspect: number;
  shadowScale: number;
  users: number;
};

type Entry = {
  art: StickerArt;
  read: () => StickerPose | null;
  holder: THREE.Group;
  lean: THREE.Group;
  roll: THREE.Group;
  shadow: THREE.Mesh;
  leanX: Spring;
  leanY: Spring;
  lift: Spring;
  wobble: Spring;
  last: { x: number; y: number } | null;
  /** Where it was drawn last. */
  pose: StickerPose | null;
};

/** The face's coordinates as its texture's: x across, y up from the bottom. */
const uvGenerator = (aspect: number) => ({
  generateTopUV: (
    _geometry: THREE.ExtrudeGeometry,
    vertices: number[],
    a: number,
    b: number,
    c: number
  ) =>
    [a, b, c].map(
      (i) => new THREE.Vector2(vertices[i * 3], vertices[i * 3 + 1] / aspect)
    ),
  generateSideWallUV: () => [0, 1, 2, 3].map(() => new THREE.Vector2(0, 0)),
});

export class StickerRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 100_000);
  private rim = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  private built = new Map<StickerArt, Built>();
  private entries = new Set<Entry>();
  private pointer = { x: -1e5, y: -1e5 };
  private frame = 0;
  /** Something came, went or the screen changed: draw the next frame. */
  private dirty = true;
  private lastTime = 0;
  private width = 0;
  private height = 0;
  private still: boolean;
  private onPointer = (event: PointerEvent) => {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  };
  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    this.scene.environmentIntensity = 0.9;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-0.6, 1, 1.4);
    this.scene.add(key, new THREE.AmbientLight(0xffffff, 0.55));
    this.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    window.addEventListener("resize", this.onResize);
    this.resize();
  }

  private resize() {
    this.dirty = true;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    // At this distance one unit on the z = 0 plane is one CSS pixel.
    this.camera.position.set(
      0,
      0,
      this.height / 2 / Math.tan((FOV / 2) * (Math.PI / 180))
    );
    this.camera.near = this.camera.position.z / 20;
    this.camera.far = this.camera.position.z * 4;
    this.camera.updateProjectionMatrix();
  }

  private build(art: StickerArt): Built {
    const known = this.built.get(art);
    if (known) {
      known.users++;
      return known;
    }
    const shapes = art.rings.map(
      (ring) =>
        new THREE.Shape(
          ring.map(([x, y]) => new THREE.Vector2(x, art.aspect - y))
        )
    );
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL * 0.7,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 1,
      UVGenerator: uvGenerator(art.aspect),
    });
    geometry.translate(-0.5, -art.aspect / 2, -DEPTH / 2);
    const map = new THREE.CanvasTexture(art.face);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const face = new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      // A little of its own light: the picture keeps its colors, whatever
      // the lighting – the gloss comes on top.
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 0.32,
    });
    const shadowMap = new THREE.CanvasTexture(art.shadow);
    const shadow = new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.3,
    });
    const built: Built = {
      geometry,
      face,
      shadow,
      aspect: art.aspect,
      shadowScale: art.shadowScale,
      users: 1,
    };
    this.built.set(art, built);
    return built;
  }

  private release(art: StickerArt) {
    const built = this.built.get(art);
    if (!built || --built.users > 0) return;
    built.geometry.dispose();
    built.face.map?.dispose();
    built.face.dispose();
    built.shadow.map?.dispose();
    built.shadow.dispose();
    this.built.delete(art);
  }

  /** A sticker to draw from now on; the returned function takes it away. */
  add(art: StickerArt, read: () => StickerPose | null) {
    const built = this.build(art);
    const sticker = new THREE.Mesh(built.geometry, [built.face, this.rim]);
    const roll = new THREE.Group();
    roll.add(sticker);
    const lean = new THREE.Group();
    lean.add(roll);
    // Its own copy of the shadow's material: each lifts on its own.
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(
        built.shadowScale,
        built.aspect * built.shadowScale
      ),
      built.shadow.clone()
    );
    shadow.renderOrder = -1;
    const holder = new THREE.Group();
    holder.add(shadow, lean);
    holder.visible = false;
    this.scene.add(holder);
    const entry: Entry = {
      art,
      read,
      holder,
      lean,
      roll,
      shadow,
      leanX: spring(),
      leanY: spring(),
      lift: spring(),
      wobble: spring(),
      last: null,
      pose: null,
    };
    this.entries.add(entry);
    this.dirty = true;
    this.start();
    return () => {
      this.entries.delete(entry);
      this.dirty = true;
      this.scene.remove(holder);
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      this.release(art);
      this.start();
    };
  }

  private start() {
    if (!this.frame) {
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  /**
   * Every frame each sticker's box is read (cheap); the scene is drawn only
   * when one of them moved or is still settling – resting stickers cost no
   * GPU at all.
   */
  private tick = (now: number) => {
    this.frame = 0;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000) || 1 / 60;
    this.lastTime = now;
    let changed = this.dirty;
    for (const entry of this.entries) {
      if (this.place(entry, dt)) changed = true;
    }
    if (changed) this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    if (this.entries.size) this.frame = requestAnimationFrame(this.tick);
    else this.renderer.clear();
  };

  /** Puts a sticker where its box is – true when that changed anything. */
  private place(entry: Entry, dt: number) {
    const pose = entry.read();
    if (!pose || pose.width < 1) {
      const was = entry.holder.visible;
      entry.holder.visible = false;
      entry.last = null;
      entry.pose = null;
      return was;
    }
    const built = this.built.get(entry.art);
    if (!built) return false;
    const before = entry.pose;
    const moved =
      !(before && entry.holder.visible) ||
      Math.abs(before.x - pose.x) > 0.05 ||
      Math.abs(before.y - pose.y) > 0.05 ||
      Math.abs(before.width - pose.width) > 0.05 ||
      Math.abs(before.rotation - pose.rotation) > 0.01 ||
      before.lift !== pose.lift;
    entry.pose = pose;
    entry.holder.visible = true;
    // The face is wider than the picture by the rim.
    const size = pose.width / entry.art.pictureShare;
    entry.holder.position.set(
      pose.x - this.width / 2,
      this.height / 2 - pose.y,
      0
    );

    // Thrown: its speed leans it into the move, then it wobbles back.
    const vx = entry.last ? (pose.x - entry.last.x) / dt : 0;
    const vy = entry.last ? (pose.y - entry.last.y) / dt : 0;
    entry.last = { x: pose.x, y: pose.y };

    if (this.still) {
      entry.leanX.target = 0;
      entry.leanY.target = 0;
    } else {
      // Looks at the pointer when it is near.
      const near = Math.max(260, size * 1.3);
      const dx = this.pointer.x - pose.x;
      const dy = this.pointer.y - pose.y;
      const closeness = clamp(1 - Math.hypot(dx, dy) / (near * 2.2), 0, 1);
      entry.leanY.target =
        clamp(dx / near, -1, 1) * MAX_LEAN * closeness +
        clamp(vx / 2600, -0.5, 0.5);
      entry.leanX.target =
        clamp(dy / near, -1, 1) * MAX_LEAN * closeness +
        clamp(vy / 2600, -0.5, 0.5);
      entry.wobble.target = clamp(vx / 4000, -0.25, 0.25);
    }
    entry.lift.target = pose.lift;
    step(entry.leanX, dt);
    step(entry.leanY, dt);
    step(entry.wobble, dt, 180, 9);
    step(entry.lift, dt, 260, 22);

    const lift = Math.max(0, entry.lift.value);
    const grow = 1 + lift * 0.035;
    entry.lean.scale.setScalar(size * grow);
    entry.lean.rotation.set(entry.leanX.value, entry.leanY.value, 0);
    const roll = (-pose.rotation * Math.PI) / 180 - entry.wobble.value;
    entry.roll.rotation.set(0, 0, roll);

    // The shadow lies on the slide: under the sticker, further off when
    // lifted, softer and lighter.
    const off = size * (0.018 + lift * 0.025);
    entry.shadow.position.set(off * 0.5, -off, -size * 0.06);
    entry.shadow.rotation.set(0, 0, roll);
    entry.shadow.scale.setScalar(size * (1 + lift * 0.05));
    (entry.shadow.material as THREE.MeshBasicMaterial).opacity =
      0.3 - lift * 0.05;
    return (
      moved ||
      moving(entry.leanX) ||
      moving(entry.leanY) ||
      moving(entry.wobble) ||
      moving(entry.lift)
    );
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    window.removeEventListener("resize", this.onResize);
    for (const built of this.built.values()) {
      built.geometry.dispose();
      built.face.dispose();
      built.shadow.dispose();
    }
    this.rim.dispose();
    this.renderer.dispose();
  }
}
