import type { Access } from "payload";

/**
 * Who may do what. ppp has one kind of login – the admins (`users`); nobody
 * else signs in. Visitors only read: the slides, the cards and what they
 * show (themes, pictures).
 */

/** Someone logged in to the admin. A plain boolean, so it fits `access.admin`. */
export const admins: Access = ({ req }) => Boolean(req.user);

/** Anyone – reading what a page shows. */
export const anyone: Access = () => true;

/** Nobody over the API – only server code, with `overrideAccess`. */
export const nobody: Access = () => false;
