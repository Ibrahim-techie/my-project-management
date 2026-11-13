import crypto from "node:crypto";
import User from "../models/user.models.js";
import asynchandler from "../utils/asynchandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { authCookieOptions, generateAccessAndRefreshTokens } from "./auth.controller.js";

/*
 * Sign in with Google or GitHub (OAuth 2.0 authorization code flow).
 *
 *   GET /auth/oauth/providers           which providers are configured
 *   GET /auth/oauth/:provider           sends the browser to the provider
 *   GET /auth/oauth/:provider/callback  the provider sends it back here
 *
 * The browser reaches these through the web app's own origin (Vite's proxy in
 * development, the Vercel rewrite in production), so the session cookies set
 * on the callback are first-party, exactly as with email and password.
 *
 * A provider is on when both its client id and secret are set. Register
 *   <FRONTEND_URL>/api/v1/auth/oauth/<provider>/callback
 * as the redirect URI with the provider. OAUTH_REDIRECT_BASE overrides
 * FRONTEND_URL as that base when the API is reached on another origin.
 *
 * Every failure redirects to /login?oauth_error=<reason>&provider=<provider>
 * rather than answering with JSON, since the browser is navigating.
 */

const STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

const fetchJson = async (url, init = {}) => {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    const err = new Error(`${init.method || "GET"} ${new URL(url).host} failed with ${res.status}`);
    err.body = body;
    throw err;
  }
  return body;
};

const PROVIDERS = {
  google: {
    env: "GOOGLE",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    authParams: { prompt: "select_account" },
    async profile(accessToken) {
      const p = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        id: p.sub,
        email: p.email,
        emailVerified: p.email_verified === true,
        name: p.name,
        avatar: p.picture,
        handle: p.email?.split("@")[0],
      };
    },
  },
  github: {
    env: "GITHUB",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    authParams: { allow_signup: "true" },
    async profile(accessToken) {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "CAMP",
      };
      const [user, emails] = await Promise.all([
        fetchJson("https://api.github.com/user", { headers }),
        fetchJson("https://api.github.com/user/emails", { headers }),
      ]);
      // the primary address if it is verified, otherwise any verified one
      const list = Array.isArray(emails) ? emails : [];
      const email = list.find((e) => e.primary && e.verified) || list.find((e) => e.verified);
      return {
        id: String(user.id),
        email: email?.email,
        emailVerified: Boolean(email),
        name: user.name || user.login,
        avatar: user.avatar_url,
        handle: user.login,
      };
    },
  },
};

const credentialsFor = (provider) => {
  const { env } = PROVIDERS[provider];
  const clientId = process.env[`${env}_CLIENT_ID`];
  const clientSecret = process.env[`${env}_CLIENT_SECRET`];
  return clientId && clientSecret ? { clientId, clientSecret } : null;
};

const isEnabled = (provider) => Object.hasOwn(PROVIDERS, provider) && Boolean(credentialsFor(provider));

const trimSlash = (url) => (url || "").replace(/\/+$/, "");
const frontendUrl = () => trimSlash(process.env.FRONTEND_URL);
const redirectUriFor = (provider) =>
  `${trimSlash(process.env.OAUTH_REDIRECT_BASE) || frontendUrl()}/api/v1/auth/oauth/${provider}/callback`;

// Only same-site paths, so the redirect after sign-in can't be pointed elsewhere
const safeReturnTo = (value) => {
  if (typeof value !== "string" || value.length > 512) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (/^\/(login|register)\b/.test(value)) return "/";
  return value;
};

const stateCookieOptions = {
  ...authCookieOptions,
  path: "/api/v1/auth/oauth",
  maxAge: STATE_TTL_MS,
};

const toLogin = (res, reason, provider) => {
  const params = new URLSearchParams({ oauth_error: reason });
  if (provider && Object.hasOwn(PROVIDERS, provider)) params.set("provider", provider);
  return res.redirect(302, `${frontendUrl()}/login?${params}`);
};

const sameSecret = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** GET /auth/oauth/providers */
export const listOAuthProviders = (_req, res) =>
  res.status(200).json(
    new ApiResponse(200, "OAuth providers", {
      providers: Object.keys(PROVIDERS).filter(isEnabled),
    }),
  );

/** GET /auth/oauth/:provider?returnTo=/path */
export const startOAuth = (req, res) => {
  const { provider } = req.params;
  if (!Object.hasOwn(PROVIDERS, provider)) return toLogin(res, "unavailable");
  const creds = credentialsFor(provider);
  if (!creds) return toLogin(res, "unavailable", provider);

  const state = crypto.randomBytes(32).toString("base64url");
  const returnTo = safeReturnTo(req.query.returnTo);
  res.cookie(STATE_COOKIE, JSON.stringify({ state, provider, returnTo }), stateCookieOptions);

  const { authorizeUrl, scope, authParams } = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUriFor(provider),
    response_type: "code",
    scope,
    state,
    ...authParams,
  });
  return res.redirect(302, `${authorizeUrl}?${params}`);
};

const readState = (req) => {
  try {
    return JSON.parse(req.cookies?.[STATE_COOKIE] || "null");
  } catch {
    return null;
  }
};

const exchangeCode = async (provider, code, creds) => {
  const body = await fetchJson(PROVIDERS[provider].tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      redirect_uri: redirectUriFor(provider),
      grant_type: "authorization_code",
    }),
  });
  // GitHub answers 200 with { error } when the code is bad or reused
  if (!body.access_token) {
    const err = new Error(`token exchange returned ${body.error || "no access token"}`);
    throw err;
  }
  return body.access_token;
};

// A free username from the provider handle: lowercase, letters, digits, . _ -
const uniqueUserName = async (handle) => {
  const base =
    (handle || "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "")
      .replace(/^[._-]+|[._-]+$/g, "")
      .slice(0, 24) || "member";
  if (!(await User.exists({ userName: base }))) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}${crypto.randomInt(1000, 10000)}`;
    if (!(await User.exists({ userName: candidate }))) return candidate;
  }
  return `${base}${crypto.randomBytes(4).toString("hex")}`;
};

/**
 * The user for a provider profile: the one already linked to it, else the one
 * with the same (provider-verified) email, which gets linked, else a new one.
 */
const userForProfile = async (provider, profile) => {
  const linked = await User.findOne({ oauth: { $elemMatch: { provider, providerId: profile.id } } });
  if (linked) return linked;

  const email = profile.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    // Someone may have registered this email without ever proving they own
    // it. The provider just did prove it, so drop that unproven password and
    // end any sessions rather than hand the account to whoever set it.
    if (!existing.isEmailVerified) {
      existing.password = undefined;
      existing.refreshToken = undefined;
      existing.tokenVersion = (existing.tokenVersion ?? 0) + 1;
      existing.emailVerificationToken = undefined;
      existing.emailVerificationtokenExpiry = undefined;
      existing.isEmailVerified = true;
    }
    existing.oauth = [...(existing.oauth || []), { provider, providerId: profile.id }];
    await existing.save({ validateBeforeSave: false });
    return existing;
  }

  const userName = await uniqueUserName(profile.handle);
  return User.create({
    userName,
    email,
    fullName: (profile.name || userName).trim().slice(0, 80),
    isEmailVerified: true,
    oauth: [{ provider, providerId: profile.id }],
    ...(profile.avatar ? { avatar: { url: profile.avatar, localPath: "" } } : {}),
  });
};

/** GET /auth/oauth/:provider/callback?code&state (or ?error) */
export const oauthCallback = asynchandler(async (req, res) => {
  const { provider } = req.params;
  const saved = readState(req);
  res.clearCookie(STATE_COOKIE, { ...stateCookieOptions, maxAge: undefined });

  if (!Object.hasOwn(PROVIDERS, provider)) return toLogin(res, "unavailable");
  const creds = credentialsFor(provider);
  if (!creds) return toLogin(res, "unavailable", provider);

  // The person pressed Cancel or Deny on the provider's page
  if (req.query.error) {
    return toLogin(res, req.query.error === "access_denied" ? "cancelled" : "failed", provider);
  }

  // No state cookie (it expired, or the flow didn't start here) or a mismatch
  if (!saved || saved.provider !== provider || !sameSecret(saved.state, req.query.state)) {
    return toLogin(res, "expired", provider);
  }
  if (typeof req.query.code !== "string" || !req.query.code) return toLogin(res, "failed", provider);

  try {
    const accessToken = await exchangeCode(provider, req.query.code, creds);
    const profile = await PROVIDERS[provider].profile(accessToken);
    if (!profile.id) return toLogin(res, "failed", provider);
    if (!profile.email || !profile.emailVerified) return toLogin(res, "unverified_email", provider);

    const user = await userForProfile(provider, profile);
    const tokens = await generateAccessAndRefreshTokens(user._id);

    return res
      .cookie("accessToken", tokens.accessToken, authCookieOptions)
      .cookie("refreshToken", tokens.refreshToken, authCookieOptions)
      .redirect(302, `${frontendUrl()}${safeReturnTo(saved.returnTo)}`);
  } catch (error) {
    console.error(`[oauth] ${provider} sign-in failed:`, error.message, error.body?.error || "");
    return toLogin(res, "failed", provider);
  }
});
