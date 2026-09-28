import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./auth-redirect";

describe("sanitizeNextPath", () => {
  describe("prihvaća sigurne interne putove", () => {
    it.each([
      "/dashboard",
      "/inventory",
      "/workspace/abc-123",
      "/listing/xyz?tab=prices",
      "/research#comps",
      "/",
    ])("prihvaća %s", (path) => {
      expect(sanitizeNextPath(path)).toBe(path);
    });
  });

  describe("odbacuje vanjske URL-ove preko backslasha", () => {
    it.each([
      "/\\attacker.com",
      "/\\attacker.com/phishing",
      "/\\\\attacker.com",
      "/dashboard\\@attacker.com",
      "\\attacker.com",
      "/%5cattacker.com".replace("%5c", "\\"),
    ])("odbacuje %s", (path) => {
      expect(sanitizeNextPath(path)).toBeUndefined();
    });
  });

  describe("odbacuje protocol-relative i apsolutne URL-ove", () => {
    it.each([
      "//attacker.com",
      "//attacker.com/login",
      "https://attacker.com",
      "http://attacker.com",
      "javascript:alert(1)",
    ])("odbacuje %s", (path) => {
      expect(sanitizeNextPath(path)).toBeUndefined();
    });
  });

  describe("odbacuje vrijednosti koje nisu stringovi ili ne počinju s /", () => {
    it.each([undefined, null, 42, {}, [], true, "", "dashboard", "attacker.com"])(
      "odbacuje %s",
      (value) => {
        expect(sanitizeNextPath(value)).toBeUndefined();
      },
    );
  });
});
