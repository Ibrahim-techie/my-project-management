import { normalizeUserName, userNameProblem } from "./username-rules.js";

/** How long the form waits after the last keystroke before asking the API */
export const CHECK_DELAY_MS = 400;

export const IDLE = Object.freeze({ value: "", status: "idle", code: "", message: "", suggestions: [] });

// A failed check is never reported as "taken": say what actually went wrong
const failure = (error) => {
  const status = error?.response?.status;
  if (status === 429) {
    return { code: "rate_limited", message: "Too many checks. Wait a moment, then try again." };
  }
  if (status === 422) {
    const detail = error.response.data?.errors?.[0]?.userName;
    return { status: "invalid", code: "rejected", message: detail || "This username isn't allowed." };
  }
  if (!error?.response) {
    return { code: "network", message: "Couldn't check availability. Check your connection." };
  }
  return { code: "server", message: "Couldn't check availability right now." };
};

// Only well-formed, valid, distinct names other than the one just checked
const cleanSuggestions = (list, userName) => [
  ...new Set(
    (Array.isArray(list) ? list : []).filter(
      (s) => typeof s === "string" && s === normalizeUserName(s) && s && s !== userName && !userNameProblem(s),
    ),
  ),
];

/**
 * Debounced, race-safe username availability checks. Plain JavaScript, so
 * the timing logic can be tested without React; use-username-availability.js
 * wraps it in a hook.
 *
 * - Every input change replaces the state at once (with "checking"), so a
 *   result for an earlier value is never on screen for a newer one. The
 *   request itself waits until typing pauses for `delay` ms.
 * - Each input gets a sequence number. A check may only report while its
 *   number is still the latest, and a newer input aborts it, so a slow
 *   response can never overwrite the answer for what is typed now.
 * - Invalid input is reported locally and never sent.
 *
 * `check(userName, { signal })` resolves to the API's data
 * ({ userName, available, suggestions }) or rejects with an axios-style error.
 * `onChange(state)` receives { value, status, code, message, suggestions },
 * with status idle, invalid, checking, available, taken or error.
 */
export function createUsernameChecker({ check, onChange, delay = CHECK_DELAY_MS }) {
  let latest = 0; // sequence number of the newest input
  let current = null; // the normalized value the state describes
  let timer = null;
  let request = null; // AbortController of the check in flight

  const emit = (state) => onChange({ ...IDLE, ...state });

  const halt = () => {
    clearTimeout(timer);
    timer = null;
    request?.abort();
    request = null;
  };

  const run = async (userName, id) => {
    const controller = new AbortController();
    request = controller;
    try {
      const data = await check(userName, { signal: controller.signal });
      if (id !== latest) return; // superseded while in flight
      if (data?.available) {
        emit({ value: userName, status: "available", message: "Username is available" });
      } else {
        emit({
          value: userName,
          status: "taken",
          message: "Username is already taken",
          suggestions: cleanSuggestions(data?.suggestions, userName),
        });
      }
    } catch (error) {
      if (id !== latest || controller.signal.aborted) return;
      emit({ value: userName, status: "error", ...failure(error) });
    } finally {
      if (request === controller) request = null;
    }
  };

  const start = (raw, { force = false, now = false } = {}) => {
    const userName = normalizeUserName(raw);
    if (userName === current && !force) return; // nothing new, e.g. a trailing space
    current = userName;
    latest += 1;
    halt();
    if (!userName) return emit(IDLE);
    const problem = userNameProblem(userName);
    if (problem) return emit({ value: userName, status: "invalid", ...problem });
    emit({ value: userName, status: "checking", message: "Checking availability…" });
    const id = latest;
    timer = setTimeout(
      () => {
        timer = null;
        run(userName, id);
      },
      now ? 0 : delay,
    );
  };

  return {
    /** The input changed */
    update: (raw) => start(raw),
    /** Check `raw` without waiting for a typing pause, e.g. a picked suggestion */
    checkNow: (raw) => start(raw, { force: true, now: true }),
    /** Check the current value again, e.g. after a failed check or a 409 on submit */
    recheck: () => {
      if (current) start(current, { force: true, now: true });
    },
    /** Stop the pending and running checks; a later update starts afresh */
    dispose: () => {
      latest += 1;
      halt();
      current = null;
    },
  };
}
