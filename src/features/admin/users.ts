import type { CollectionConfig } from "payload";
import { admins } from "@/access";

/** The admins – the logins of the CMS. In practice: one, me. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Admin", plural: "Admins" },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: admins,
    read: admins,
    update: admins,
    delete: admins,
    unlock: admins,
  },
  admin: {
    group: "Settings",
    defaultColumns: ["name", "email"],
    useAsTitle: "email",
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  fields: [{ name: "name", type: "text" }],
  timestamps: true,
};
