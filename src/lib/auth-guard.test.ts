import { describe, it, expect } from "vitest";
import { decideAuthGuard, postAuthRedirect } from "@/lib/auth-guard";

describe("auth-guard: decideAuthGuard", () => {
  it("redirects when session is null", () => {
    const d = decideAuthGuard(null);
    expect(d.kind).toBe("redirect");
    if (d.kind === "redirect") expect(d.to).toBe("/auth");
  });

  it("redirects when supabase returned an auth error", () => {
    const d = decideAuthGuard({ user: { id: "x" }, error: { message: "expired" } });
    expect(d.kind).toBe("redirect");
    if (d.kind === "redirect") expect(d.reason).toBe("auth-error");
  });

  it("redirects when there's no user object", () => {
    const d = decideAuthGuard({ user: null });
    expect(d.kind).toBe("redirect");
    if (d.kind === "redirect") expect(d.reason).toBe("no-session");
  });

  it("allows when user is present and no error", () => {
    const d = decideAuthGuard({ user: { id: "abc", email: "a@b.com" } });
    expect(d.kind).toBe("allow");
    if (d.kind === "allow") expect(d.userId).toBe("abc");
  });

  it("treats empty user id as unauthenticated", () => {
    const d = decideAuthGuard({ user: { id: "" } });
    expect(d.kind).toBe("redirect");
  });
});

describe("auth-guard: postAuthRedirect", () => {
  it("sends finished users to dashboard", () => {
    expect(postAuthRedirect(true)).toBe("/dashboard");
  });
  it("sends new/incomplete users to onboarding", () => {
    expect(postAuthRedirect(false)).toBe("/onboarding");
    expect(postAuthRedirect(null)).toBe("/onboarding");
    expect(postAuthRedirect(undefined)).toBe("/onboarding");
  });
});
