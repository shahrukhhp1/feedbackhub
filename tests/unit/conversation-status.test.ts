import { describe, expect, it } from "vitest";
import { transitionConversationStatus } from "@/server/services/conversations/status";

describe("transitionConversationStatus", () => {
  it("moves to waiting_for_user on admin reply", () => {
    expect(transitionConversationStatus("open", { type: "admin_reply" })).toBe("waiting_for_user");
    expect(transitionConversationStatus("waiting_for_user", { type: "admin_reply" })).toBe(
      "waiting_for_user",
    );
  });

  it("moves to open on mobile message", () => {
    expect(transitionConversationStatus("waiting_for_user", { type: "mobile_message" })).toBe(
      "open",
    );
    expect(transitionConversationStatus("closed", { type: "mobile_message" })).toBe("open");
  });

  it("closes open conversations", () => {
    expect(transitionConversationStatus("open", { type: "admin_close" })).toBe("closed");
    expect(transitionConversationStatus("waiting_for_user", { type: "admin_close" })).toBe(
      "closed",
    );
  });

  it("rejects closing an already closed conversation", () => {
    expect(transitionConversationStatus("closed", { type: "admin_close" })).toBeNull();
  });

  it("reopens closed conversations", () => {
    expect(transitionConversationStatus("closed", { type: "admin_reopen" })).toBe("open");
  });

  it("rejects reopening non-closed conversations", () => {
    expect(transitionConversationStatus("open", { type: "admin_reopen" })).toBeNull();
    expect(transitionConversationStatus("waiting_for_user", { type: "admin_reopen" })).toBeNull();
  });
});
