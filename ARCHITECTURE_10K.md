# Yaroo 10k Concurrent Chat Architecture

This is the production target architecture for supporting about 10,000 concurrent chat users with room for horizontal growth.

## Runtime Topology

- Run multiple Node.js API instances behind a load balancer.
- Enable WebSocket support on the load balancer.
- Use sticky sessions when long polling is enabled. If the load balancer cannot do sticky sessions, force websocket-only transport at the edge.
- Set `REDIS_URL` in production so Socket.IO uses the Redis adapter for cross-instance events.
- Keep MongoDB as the source of truth for users, friendships, messages, delivery state, and unread state.
- Use Redis for Socket.IO pub/sub, realtime fan-out, and lightweight online presence.

## Realtime Flow

Each authenticated socket joins a stable room:

```text
user:<userId>
```

Message, friend, typing, seen, edit, and delete events emit to user rooms instead of local socket IDs. With the Redis adapter enabled, emitting to `user:<id>` reaches the user even if their socket is connected to another Node.js instance.

## Implemented In This Repo

- Optional Redis Socket.IO adapter in `backend/lib/socket.js`.
- JWT cookie authentication for sockets.
- Stale-token and deleted-user rejection on socket connect.
- Cluster-safe helpers:
  - `emitToUser`
  - `emitToUsers`
  - `emitToUserWithAck`
- Redis-backed online presence via `yaroo:online-users` when `REDIS_URL` is set.
- Message and friend controllers now use room-based emits.
- CORS allows `PATCH`, which is required by realtime read receipts.
- Client sockets send credentials and no longer trust a spoofable `userId` query.

## Production Environment For 10k

```env
NODE_ENV=production
MONGODB_URI=<mongodb atlas or replica set uri>
JWT_SECRET=<32+ character secret>
FRONTEND_URL=https://your-domain.com
REDIS_URL=redis://default:<password>@<redis-host>:6379
MONGO_AUTO_INDEX=false
```

`REDIS_URL` is optional for a single backend instance, but it is required before running multiple backend instances for the 10k concurrent chat target.

Run indexes during deploy or maintenance:

```bash
npm run db:indexes
```

## Capacity Notes

For 10k concurrent users, start with:

- 2-4 Node.js instances.
- 1-2 vCPU and 1-2 GB RAM per instance as a baseline.
- Redis with enough connection headroom for Socket.IO pub/sub clients.
- MongoDB Atlas M10+ or equivalent, then scale based on slow queries and connection pressure.
- CDN/object storage for media. Cloudinary already handles uploaded images.

## Load Balancer Requirements

- WebSocket upgrade enabled.
- Idle timeout above Socket.IO ping timeout, for example 60 seconds or higher.
- Forward cookies to the Node.js app.
- Preserve `X-Forwarded-*` headers.

## Production Checks

Before deploy:

```bash
npm run build
npm run db:indexes
npm audit --omit=dev
npm audit --omit=dev --prefix frontend
```

After deploy:

```bash
curl https://your-domain.com/health
```

Expected health response should have `status: "ok"` and database `status: "connected"`.

## Next Scale Improvements

- Add stale-presence reconciliation if worker crashes become frequent.
- Add structured JSON logging and request metrics.
- Add per-user message send limits to reduce spam.
- Add queue-backed media processing if image traffic grows.
- Add load tests with Artillery or k6 before raising the concurrency target beyond 10k.
