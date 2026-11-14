/*
 * The API's username rules (src/utils/username.js), mirrored so the form can
 * flag a bad username without a request. Keep the two files in step.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Trim and lowercase: the form the API stores and compares usernames in */
export const normalizeUserName = (value) => String(value ?? "").trim().toLowerCase();

/** Length as the API counts it: an emoji counts once, variation selectors not at all */
export const userNameLength = (value) =>
  value.length -
  (value.match(/[︎️]/g) || []).length -
  (value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;

/**
 * What's wrong with a normalized username as `{ code, message }`, or null
 * when it's fine. Empty input isn't a problem, just nothing to check yet.
 */
export const userNameProblem = (userName) => {
  if (!userName) return null;
  const length = userNameLength(userName);
  if (length < USERNAME_MIN_LENGTH) {
    return { code: "too_short", message: `Use at least ${USERNAME_MIN_LENGTH} characters` };
  }
  if (length > USERNAME_MAX_LENGTH) {
    return { code: "too_long", message: `Use ${USERNAME_MAX_LENGTH} characters or fewer` };
  }
  return null;
};
