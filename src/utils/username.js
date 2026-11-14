/*
 * Username rules, in one place. Registration (validators/index.js) uses them.
 *
 * A username is stored trimmed and lowercase (the User schema also trims and
 * lowercases on write) and is 3 to 20 characters long. There is no character
 * allow-list: registration has never had one.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Trim and lowercase: the form usernames are stored and compared in */
export const normalizeUserName = (value) => String(value ?? "").trim().toLowerCase();

/**
 * Length as express-validator's isLength() counts it, so these rules match the
 * registration validator: a character outside the BMP (such as an emoji)
 * counts once, and the variation selectors U+FE0E and U+FE0F don't count.
 */
export const userNameLength = (value) =>
  value.length -
  (value.match(/[︎️]/g) || []).length -
  (value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;

/** True when `value` is a username registration accepts, in its stored form */
export const isValidUserName = (value) => {
  if (typeof value !== "string" || value !== normalizeUserName(value)) return false;
  const length = userNameLength(value);
  return length >= USERNAME_MIN_LENGTH && length <= USERNAME_MAX_LENGTH;
};

