"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StickerArt } from "./art";
import type { StickerPose, StickerRenderer } from "./renderer";

type Stage = {
  /** Draws a sticker in 3D – null while there is no 3D (yet, or at all). */
  add: (
    art: StickerArt,
    read: () => StickerPose | null,
    node: Element
  ) => (() => void) | null;
  /** Made ready ahead (its 3D shape built) – a sticker about to come. */
  prepare: (art: StickerArt) => void;
  /** The 3D canvas is running. */
  ready: boolean;
  /** Where the canvas goes (StickerCanvas). */
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

const StageContext = createContext<Stage>({
  add: () => null,
  prepare: () => undefined,
  ready: false,
  canvasRef: { current: null },
});

/** The page's stickers' 3D stage – a sticker asks it to be drawn. */
export const useStickerStage = () => useContext(StageContext);

/**
 * The canvas the stickers are drawn on in 3D, over everything but the
 * controls; clicks go through it. Without WebGL the stickers stay flat
 * pictures with a white edge (sticker.tsx) – nothing else changes.
 */
export const StickerStage = ({ children }: { children: ReactNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<StickerRenderer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    // three.js only where it is needed – loaded after the page.
    import("./renderer")
      .then(({ StickerRenderer }) => {
        const canvas = canvasRef.current;
        if (!(on && canvas)) return;
        rendererRef.current = new StickerRenderer(canvas);
        setReady(true);
      })
      .catch((error) => console.warn("Stickers stay flat:", error));
    return () => {
      on = false;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  const stage = useMemo<Stage>(
    () => ({
      add: (art, read, node) =>
        rendererRef.current?.add(art, read, node) ?? null,
      prepare: (art) => rendererRef.current?.prepare(art),
      ready,
      canvasRef,
    }),
    [ready]
  );

  return (
    <StageContext.Provider value={stage}>{children}</StageContext.Provider>
  );
};

/**
 * The stickers' 3D canvas: over the slides, under the slide's own buttons
 * and the confetti (the stage's layer above) – put where that holds.
 */
export const StickerCanvas = () => {
  const { canvasRef } = useStickerStage();
  return (
    <canvas
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 size-full"
      ref={canvasRef}
    />
  );
};
