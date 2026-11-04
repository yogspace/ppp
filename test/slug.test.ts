import { describe, expect, it } from "vitest";
import { slugify, slugProblem } from "@/features/slug/slug";

describe("addresses", () => {
  it("makes one from a title", () => {
    expect(slugify("Hello, ppp!")).toBe("hello-ppp");
    expect(slugify("Grüße für Jörg")).toBe("gruesse-fuer-joerg");
    expect(slugify("  Crème brûlée  ")).toBe("creme-brulee");
    expect(slugify("a".repeat(80)).length).toBe(60);
  });

  it("accepts plain ones, refuses the rest and the site's own", () => {
    expect(slugProblem("my-talk")).toBeNull();
    expect(slugProblem("My Talk")).not.toBeNull();
    expect(slugProblem("a--b")).not.toBeNull();
    expect(slugProblem("-a")).not.toBeNull();
    expect(slugProblem("admin")).not.toBeNull();
    expect(slugProblem("api")).not.toBeNull();
  });
});
