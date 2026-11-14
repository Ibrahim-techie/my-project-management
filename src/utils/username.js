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

// Readable variations first, then numbered ones, in the order they are offered
const SUGGESTION_PATTERNS = [
  { suffix: "_dev" },
  { suffix: "01" },
  { prefix: "the" },
  { suffix: "codes" },
  // 02 to 30
  ...Array.from({ length: 29 }, (_, i) => ({ suffix: String(i + 2).padStart(2, "0") })),
];

// "ibrahim_dev" shouldn't become "ibrahim_dev_dev", nor "theo" "thetheo"
const alreadyHas = (base, { prefix, suffix }) =>
  (prefix && base.startsWith(prefix)) || (suffix && /\D/.test(suffix) && base.endsWith(suffix));

// prefix + base + suffix, with the base shortened by whole characters so the
// result fits the length limit
const fit = (base, { prefix = "", suffix = "" }) => {
  const room = USERNAME_MAX_LENGTH - userNameLength(prefix) - userNameLength(suffix);
  const cut = Array.from(base).slice(0, room).join("");
  // no "ibrahim_" + "_dev" doubling, and no dangling space before a suffix
  const stem = suffix ? cut.replace(/[\s._-]+$/u, "") : cut;
  return stem ? normalizeUserName(`${prefix}${stem}${suffix}`) : "";
};

/**
 * Alternatives for a taken username, best first: name_dev, name01, thename,
 * namecodes, then name02 to name30. Each is normalized, valid, unique and
 * different from `base`, and fits the length limit. Deterministic: whether
 * they are free is for the caller to check.
 */
export const userNameSuggestionCandidates = (base) => {
  const seen = new Set([base]);
  const candidates = [];
  for (const pattern of SUGGESTION_PATTERNS) {
    if (alreadyHas(base, pattern)) continue;
    const candidate = fit(base, pattern);
    if (candidate && !seen.has(candidate) && isValidUserName(candidate)) {
      seen.add(candidate);
      candidates.push(candidate);
    }
  }
  return candidates;
};
