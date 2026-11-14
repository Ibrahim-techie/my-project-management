import { useEffect, useState } from "react";
import { api, unwrap } from "../api";
import { IDLE, createUsernameChecker } from "./username-check.js";

const checkUserName = (userName, { signal }) =>
  api.get("/auth/check-username", { params: { userName }, signal }).then(unwrap);

/**
 * Live availability of the username being typed: the checker's state
 * ({ value, status, code, message, suggestions }) plus checkNow(name) and
 * recheck(). Debouncing and stale-response handling live in username-check.js.
 */
export function useUsernameAvailability(input) {
  const [state, setState] = useState(IDLE);
  const [checker] = useState(() => createUsernameChecker({ check: checkUserName, onChange: setState }));

  useEffect(() => {
    checker.update(input);
  }, [checker, input]);

  // Leaving the page (or StrictMode's trial unmount) stops pending checks
  useEffect(() => () => checker.dispose(), [checker]);

  return { ...state, checkNow: checker.checkNow, recheck: checker.recheck };
}
