import { describe, it, expect } from "vitest";
import { toDisplayProfile, computeInitials, validateProfileUpdate } from "@/lib/profile";

describe("profile: computeInitials", () => {
  it("returns ? for empty input", () => {
    expect(computeInitials("")).toBe("?");
    expect(computeInitials("   ")).toBe("?");
  });
  it("returns first two letters for single-word names", () => {
    expect(computeInitials("Ada")).toBe("AD");
  });
  it("returns first + last initials for multi-word names", () => {
    expect(computeInitials("Ada Lovelace")).toBe("AL");
    expect(computeInitials("Maria del Carmen Vázquez")).toBe("MV");
  });
  it("uppercases", () => {
    expect(computeInitials("john doe")).toBe("JD");
  });
});

describe("profile: toDisplayProfile", () => {
  it("returns null for null/missing id", () => {
    expect(toDisplayProfile(null)).toBeNull();
    expect(toDisplayProfile({ id: "" })).toBeNull();
  });
  it("defaults to 'Friend' when display_name is missing or blank", () => {
    const p = toDisplayProfile({ id: "u1", display_name: "   " });
    expect(p?.displayName).toBe("Friend");
    expect(p?.firstName).toBe("Friend");
  });
  it("extracts first name and initials", () => {
    const p = toDisplayProfile({ id: "u1", display_name: "Ada Lovelace" });
    expect(p?.firstName).toBe("Ada");
    expect(p?.initials).toBe("AL");
  });
  it("normalizes blank avatar URLs to null", () => {
    expect(toDisplayProfile({ id: "u1", avatar_url: "  " })?.avatarUrl).toBeNull();
    expect(
      toDisplayProfile({ id: "u1", avatar_url: "https://x.test/a.png" })?.avatarUrl,
    ).toBe("https://x.test/a.png");
  });
  it("defaults locale to en", () => {
    expect(toDisplayProfile({ id: "u1" })?.locale).toBe("en");
    expect(toDisplayProfile({ id: "u1", locale: "fr-FR" })?.locale).toBe("fr-FR");
  });
  it("coerces onboarding_completed to boolean", () => {
    expect(toDisplayProfile({ id: "u1" })?.onboardingCompleted).toBe(false);
    expect(toDisplayProfile({ id: "u1", onboarding_completed: true })?.onboardingCompleted).toBe(
      true,
    );
  });
});

describe("profile: validateProfileUpdate", () => {
  it("accepts a sensible patch", () => {
    const r = validateProfileUpdate({ display_name: "Ada", locale: "en-US" });
    expect(r.ok).toBe(true);
  });
  it("rejects empty display_name", () => {
    const r = validateProfileUpdate({ display_name: "   " });
    expect(r.ok).toBe(false);
  });
  it("rejects oversized display_name", () => {
    const r = validateProfileUpdate({ display_name: "x".repeat(200) });
    expect(r.ok).toBe(false);
  });
  it("trims display_name on accept", () => {
    const r = validateProfileUpdate({ display_name: "  Ada  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch.display_name).toBe("Ada");
  });
  it("rejects non-http(s) avatar URLs", () => {
    expect(validateProfileUpdate({ avatar_url: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateProfileUpdate({ avatar_url: "ftp://x.test/a.png" }).ok).toBe(false);
    expect(validateProfileUpdate({ avatar_url: "not a url" }).ok).toBe(false);
  });
  it("accepts http(s) avatar URLs", () => {
    expect(validateProfileUpdate({ avatar_url: "https://x.test/a.png" }).ok).toBe(true);
    expect(validateProfileUpdate({ avatar_url: "http://x.test/a.png" }).ok).toBe(true);
  });
  it("rejects malformed locales", () => {
    expect(validateProfileUpdate({ locale: "ENGLISH" }).ok).toBe(false);
    expect(validateProfileUpdate({ locale: "en_US" }).ok).toBe(false);
  });
});
