import { createContext } from "react";

/**
 * True while a slide is on its way in or out (its transition, a wipe or a
 * cover over it). Its stickers are drawn flat in the page meanwhile, so they
 * turn, flip and hide with their slide – the 3D ones (stickers/renderer.ts)
 * lie over everything and know nothing of that. Its floaties start only
 * once it is still: building their 3D mid-move would make the move jerk.
 */
export const SlideMoving = createContext(false);
