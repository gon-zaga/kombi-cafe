// Default customer-facing text shown while System Down Mode is on
export const DEFAULT_SYSTEM_DOWN_MESSAGE =
  "The ordering management system is down for a moment!\n" +
  "We are working to bring it back online as quickly as possible.\n" +
  "To place your order: Please see a staff member at the counter.\n" +
  "They are ready to take your order manually!";

// Uses the owner's message, or the default when it is empty
export function resolveSystemDownMessage(message?: string | null): string {
  return message?.trim() ? message : DEFAULT_SYSTEM_DOWN_MESSAGE;
}