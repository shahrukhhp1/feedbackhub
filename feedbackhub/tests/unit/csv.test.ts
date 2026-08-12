import { describe, expect, it } from "vitest";
import { escapeCsvField, escapeCsvFormula } from "@/server/security/csv";

describe("escapeCsvFormula", () => {
  it.each(["=", "+", "-", "@", "\t", "\r"])("prefixes formula injection starting with %j", (prefix) => {
    expect(escapeCsvFormula(`${prefix}1+1`)).toBe(`'${prefix}1+1`);
  });

  it("leaves safe values unchanged", () => {
    expect(escapeCsvFormula("hello")).toBe("hello");
    expect(escapeCsvFormula("100")).toBe("100");
  });
});

describe("escapeCsvField", () => {
  it("escapes formula injection and quotes fields with commas", () => {
    expect(escapeCsvField("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField("line\nbreak")).toBe('"line\nbreak"');
  });

  it("combines formula escaping with CSV quoting", () => {
    expect(escapeCsvField("=1+1,note")).toBe(`"'=1+1,note"`);
  });
});
