import { describe, expect, it } from "vitest";
import {
  decodeSequenceCursor,
  decodeTimestampIdCursor,
  encodeSequenceCursor,
  encodeTimestampIdCursor,
} from "@/server/api/cursor";

describe("cursor utilities", () => {
  it("round-trips timestamp/id cursors", () => {
    const timestamp = new Date("2025-06-15T12:00:00.000Z");
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const cursor = encodeTimestampIdCursor(timestamp, id);

    expect(cursor).toBe(`${timestamp.getTime()}:${id}`);
    expect(decodeTimestampIdCursor(cursor)).toEqual({ timestamp, id });
  });

  it("accepts numeric timestamps", () => {
    const cursor = encodeTimestampIdCursor(1_700_000_000_000, "abc");
    expect(decodeTimestampIdCursor(cursor).timestamp.getTime()).toBe(1_700_000_000_000);
  });

  it("rejects malformed timestamp cursors", () => {
    expect(() => decodeTimestampIdCursor("invalid")).toThrow(/Invalid timestamp cursor/);
    expect(() => decodeTimestampIdCursor("123:")).toThrow(/missing id/);
    expect(() => decodeTimestampIdCursor("not-a-number:abc")).toThrow(/not a number/);
  });

  it("round-trips sequence cursors", () => {
    expect(encodeSequenceCursor(42)).toBe("42");
    expect(decodeSequenceCursor("42")).toBe(42);
  });

  it("rejects invalid sequence cursors", () => {
    expect(() => decodeSequenceCursor("-1")).toThrow(/Invalid sequence cursor/);
    expect(() => decodeSequenceCursor("1.5")).toThrow(/Invalid sequence cursor/);
    expect(() => decodeSequenceCursor("abc")).toThrow(/Invalid sequence cursor/);
  });
});
