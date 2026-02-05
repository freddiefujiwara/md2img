import { describe, expect, it } from "vitest";
import router from "./router";

describe("router", () => {
  it("registers the base and shared routes", () => {
    const paths = router.getRoutes().map((route) => route.path);

    expect(paths).toContain("/");
    expect(paths).toContain("/:encoded(.*)");
  });
});
