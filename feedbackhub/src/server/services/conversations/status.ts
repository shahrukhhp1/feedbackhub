import type { ConversationStatus } from "@/shared/constants";

export type ConversationStatusEvent =
  | { type: "admin_reply" }
  | { type: "mobile_message" }
  | { type: "admin_close" }
  | { type: "admin_reopen" };

export function transitionConversationStatus(
  current: ConversationStatus,
  event: ConversationStatusEvent,
): ConversationStatus | null {
  switch (event.type) {
    case "admin_reply":
      return "waiting_for_user";

    case "mobile_message":
      return "open";

    case "admin_close":
      if (current === "closed") {
        return null;
      }
      return "closed";

    case "admin_reopen":
      if (current !== "closed") {
        return null;
      }
      return "open";

    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
