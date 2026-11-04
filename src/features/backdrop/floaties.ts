import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * The “Floaties” background: glossy 3D shapes – a ball, a ring, a pill, a
 * star, a heart, a rounded cube … – drifting around a slide's edges,
 * turning slowly, leaning away from the pointer.
 *
 * One WebGL context for all of them (browsers allow only a few): each slide
 * showing floaties has a plain canvas, the scene is drawn once per canvas in
 * its colors and copied in. Two at a time during a transition, else one.
 *
 * The slide at rest also floats past its stage's edges, into the screen
 * around it (`around`, a canvas behind the stage): drawn once for the whole
 * screen, the stage's part copied into the slide, the whole into `around`
 * – where the stage ends, the shapes go on, right where they were.
 */

type Paint = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

type Target = Paint & {
  colors: THREE.Color[];
  seed: number;
  around: Paint | null;
};

const FOV = 30;
const DISTANCE = 12;

/** Where they float – x, y from -1 to 1 across the slide, z depth, size. */
const SPOTS: [number, number, number, number][] = [
  [-0.84, 0.66, 0, 1.05],
  [0.8, 0.72, -1, 0.9],
  [-0.92, -0.32, 1, 0.8],
  [0.88, -0.48, 0.5, 1.1],
  [-0.42, -0.86, -0.5, 0.75],
  [0.36, 0.9, 0.8, 0.7],
  [0.18, -0.92, -1.2, 0.85],
  [-0.2, 0.92, -1.5, 0.6],
  [0.62, 0.08, -2, 0.55],
];

const starShape = () => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.42 : 1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

const heartShape = () => {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const x = (16 * Math.sin(t) ** 3) / 17;
    const y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) /
        17 +
      0.15;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
};

/**
 * A flat shape made puffy: extruded with a deep round bevel, its corners
 * shared and its normals smoothed – a cushion, not a cut-out.
 */
const puffy = (shape: THREE.Shape) => {
  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.2,
    bevelSegments: 8,
    curveSegments: 24,
  });
  extruded.deleteAttribute("normal");
  extruded.deleteAttribute("uv");
  const geometry = mergeVertices(extruded, 1e-4);
  extruded.dispose();
  geometry.computeVertexNormals();
  geometry.center();
  return geometry;
};

const geometries = () => [
  new THREE.SphereGeometry(0.85, 48, 32),
  new THREE.TorusGeometry(0.72, 0.3, 28, 64),
  new THREE.CapsuleGeometry(0.42, 0.9, 12, 32),
  puffy(starShape()),
  puffy(heartShape()),
  new RoundedBoxGeometry(1.25, 1.25, 1.25, 6, 0.32),
  new THREE.TorusKnotGeometry(0.5, 0.2, 120, 20),
  new THREE.ConeGeometry(0.75, 1.3, 48),
  new THREE.SphereGeometry(0.6, 40, 28),
];

type Floaty = {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  spot: [number, number, number, number];
  spin: THREE.Vector3;
  phase: number;
};

class Floaties {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 100);
  private group = new THREE.Group();
  private floaties: Floaty[] = [];
  private targets = new Set<Target>();
  private frame = 0;
  private lean = { x: 0, y: 0, tx: 0, ty: 0 };
  private still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private onPointer = (event: PointerEvent) => {
    this.lean.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    this.lean.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-3, 5, 6);
    this.scene.add(key, new THREE.AmbientLight(0xffffff, 0.35), this.group);
    this.camera.position.set(0, 0, DISTANCE);
    geometries().forEach((geometry, i) => {
      const material = new THREE.MeshPhysicalMaterial({
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.group.add(mesh);
      this.floaties.push({
        mesh,
        material,
        spot: SPOTS[i % SPOTS.length],
        spin: new THREE.Vector3(
          0.12 + (i % 3) * 0.05,
          0.18 + (i % 4) * 0.04,
          (i % 2 ? 1 : -1) * 0.06
        ),
        phase: i * 1.7,
      });
    });
    window.addEventListener("pointermove", this.onPointer, { passive: true });
  }

  add(target: Target) {
    this.targets.add(target);
    this.last = 0;
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  remove(target: Target) {
    this.targets.delete(target);
  }

  get empty() {
    return this.targets.size === 0;
  }

  private last = 0;

  /** 30 frames a second – they drift slowly, that is plenty. */
  private tick = (now: number) => {
    this.frame = 0;
    if (!this.targets.size) return;
    if (now - this.last < 32) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.last = now;
    const t = this.still ? 0 : now / 1000;
    this.lean.x += (this.lean.tx - this.lean.x) * 0.04;
    this.lean.y += (this.lean.ty - this.lean.y) * 0.04;
    for (const target of this.targets) this.draw(target, t);
    // Less motion asked for: drawn once, then still.
    if (!this.still) this.frame = requestAnimationFrame(this.tick);
  };

  /** The screen around the stage, as seen from the stage – or null. */
  private view(target: Target, width: number, height: number) {
    const around = target.around?.canvas;
    const stage = target.canvas.closest("[data-stage]");
    if (!(around && stage)) return null;
    const s = stage.getBoundingClientRect();
    const o = around.getBoundingClientRect();
    // Nothing around it (a phone held upright: the stage is the screen).
    if (o.width <= width + 1 && o.height <= height + 1) return null;
    return {
      left: Math.round(s.left - o.left),
      top: Math.round(s.top - o.top),
      width: Math.round(o.width),
      height: Math.round(o.height),
    };
  }

  private draw(target: Target, t: number) {
    const { canvas, ctx } = target;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const view = this.view(target, width, height);
    const rw = view ? Math.round(view.width * ratio) : w;
    const rh = view ? Math.round(view.height * ratio) : h;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== rw || size.y !== rh) this.renderer.setSize(rw, rh, false);
    // Framed by the stage always – around it, the frame just reaches further.
    this.camera.aspect = width / height;
    if (view) {
      this.camera.setViewOffset(
        width,
        height,
        -view.left,
        -view.top,
        view.width,
        view.height
      );
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();

    // The slide's half width and height at depth 0.
    const halfH = Math.tan(((FOV / 2) * Math.PI) / 180) * DISTANCE;
    const halfW = halfH * this.camera.aspect;
    // By the shorter side: on a phone held upright they stay small.
    const scale = Math.min(halfW, halfH) / 3.6;
    this.floaties.forEach((floaty, i) => {
      const [x, y, z, s] = floaty.spot;
      const bob = Math.sin(t * 0.7 + floaty.phase + target.seed) * 0.18;
      floaty.mesh.position.set(
        x * halfW * 0.92 - this.lean.x * (0.2 + z * 0.08),
        y * halfH * 0.9 + bob - this.lean.y * -0.15,
        z
      );
      floaty.mesh.rotation.set(
        floaty.phase + t * floaty.spin.x,
        floaty.phase * 0.5 + t * floaty.spin.y,
        t * floaty.spin.z
      );
      floaty.mesh.scale.setScalar(s * scale);
      floaty.material.color.copy(target.colors[i % target.colors.length]);
    });
    this.renderer.render(this.scene, this.camera);
    const drawn = this.renderer.domElement;
    ctx.clearRect(0, 0, w, h);
    if (!(view && target.around)) {
      ctx.drawImage(drawn, 0, 0, w, h);
      return;
    }
    ctx.drawImage(drawn, view.left * ratio, view.top * ratio, w, h, 0, 0, w, h);
    const out = target.around;
    if (out.canvas.width !== rw || out.canvas.height !== rh) {
      out.canvas.width = rw;
      out.canvas.height = rh;
    }
    out.ctx.clearRect(0, 0, rw, rh);
    out.ctx.drawImage(drawn, 0, 0);
  }

  /** The screen around the stage to float into too – or no longer. */
  setAround(target: Target, canvas: HTMLCanvasElement | null) {
    if (target.around?.canvas === canvas) return;
    const was = target.around;
    target.around = null;
    if (was) {
      // Gone softly, the last frame fading; cleared once out of sight.
      was.canvas.style.transition = "opacity 0.3s ease";
      was.canvas.style.opacity = "0";
    }
    const ctx = canvas?.getContext("2d");
    if (!(canvas && ctx)) return;
    target.around = { canvas, ctx };
    this.draw(target, this.still ? 0 : performance.now() / 1000);
    canvas.style.transition = "opacity 0.7s ease";
    canvas.style.opacity = "1";
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("pointermove", this.onPointer);
    for (const { mesh, material } of this.floaties) {
      mesh.geometry.dispose();
      material.dispose();
    }
    this.renderer.dispose();
  }
}

let shared: Floaties | null = null;
let idle = 0;

export type FloatHandle = {
  /** Into the screen around the stage too (a canvas) – null: no longer. */
  around: (canvas: HTMLCanvasElement | null) => void;
  /** Takes them away. */
  stop: () => void;
};

/** Floaties into this canvas, in these colors. */
export const floatInto = (
  canvas: HTMLCanvasElement,
  colors: string[]
): FloatHandle | null => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  window.clearTimeout(idle);
  shared ??= new Floaties();
  const target: Target = {
    canvas,
    ctx,
    colors: colors.map((c) => new THREE.Color(c)),
    seed: Math.random() * 10,
    around: null,
  };
  shared.add(target);
  const owner = shared;
  return {
    around: (el) => owner.setAround(target, el),
    stop: () => {
      owner.setAround(target, null);
      owner.remove(target);
      // Kept a moment: the next slide likely floats too.
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        if (shared?.empty) {
          shared.dispose();
          shared = null;
        }
      }, 4000);
    },
  };
};
