/**
 * Tiny funnel-event logger.
 *
 * Used during MVP beta to understand where users drop off. Writes structured
 * lines to the browser console (and server console when used from route
 * handlers). Swap `sink` for PostHog / Mixpanel / Segment later — call sites
 * don't change.
 */

export type FunnelEvent =
  | "upload_file_selected"
  | "extract_success"
  | "extract_confirmed"
  | "score_shown"
  | "chat_first_message_sent"
  | "phase_advanced"
  | "export_clicked"
  | "export_continued"
  | "session_reset"
  | "error";

type Props = Record<string, string | number | boolean | undefined | null>;

function sink(event: FunnelEvent, props?: Props) {
  const payload = { event, ts: new Date().toISOString(), ...props };
  console.log("[funnel]", JSON.stringify(payload));
}

export function track(event: FunnelEvent, props?: Props): void {
  try {
    sink(event, props);
  } catch {
    /* never throw from an analytics call */
  }
}
