"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Size = { width: number; height: number };

const StageSize = createContext<Size>({ width: 0, height: 0 });

/** The stage's size in px – for the wipes' clip paths. */
export const useStageSize = () => useContext(StageSize);

/**
 * The stage: 16:9, as big as the screen allows, in its middle – on a screen
 * held upright (a phone) the whole screen instead. A size container named
 * `stage`: what is on it is measured in its units (cqmin, cqw, cqh), and the
 * `tall` variant lays things out for the upright one. What it holds is
 * drawn once it is measured – in the browser, never on the server.
 */
export const Stage = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className="relative aspect-video w-[min(100vw,177.78dvh)] overflow-hidden [container:stage/size] portrait:aspect-auto portrait:h-dvh portrait:w-screen"
      data-stage
      ref={ref}
    >
      <StageSize.Provider value={size}>
        {size.width > 0 && children}
      </StageSize.Provider>
    </div>
  );
};
