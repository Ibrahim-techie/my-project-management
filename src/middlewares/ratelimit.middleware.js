import ApiError from "../utils/ApiErrors.js";

/*
 * A small in-memory rate limiter: at most `max` requests per `windowMs` from
 * one client (a fixed window), then 429 with a Retry-After header until the
 * window ends. No dependency and no shared store, so counts live in this
 * process: they reset on restart and aren't shared between instances.
 *
 * Clients are told apart by req.ip. The app doesn't set Express's
 * "trust proxy", so behind a proxy (the Vercel rewrite and Render's load
 * balancer) req.ip is the proxy's address and all clients share one budget.
 * Size `max` for that, or set "trust proxy" to the real hop count first.
 */
const rateLimit = ({ windowMs, max, message, maxClients = 10_000 }) => {
  const clients = new Map(); // key -> { count, resetAt }

  // Drop finished windows so the map can't grow without bound
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= now) {
      clients.delete(key);
      // Under a flood of distinct addresses, forget the oldest window rather than grow
      if (clients.size >= maxClients) clients.delete(clients.keys().next().value);
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return next(new ApiError(429, message));
    }
    return next();
  };
};

export default rateLimit;
