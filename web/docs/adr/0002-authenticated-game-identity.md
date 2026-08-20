# ADR 0002: Authenticated game identity and ownership

## Status
Accepted

## Date
2026-07-29

## Context
GoiFlow's multiplayer game APIs previously accepted `participantId` and `userId` directly from request bodies, without verifying that the caller owned or was a member of the referenced session. This allowed any caller with knowledge of identifiers to submit answers on behalf of other participants, view session state outside their membership scope, and create rooms without authentication. The schema already provides `@@unique([gameSessionId, userId])` on `GameParticipant` and tracks `hostParticipantId` on `GameSession`, but the middleware layer did not enforce these constraints.

## Decision
Game identity is exclusively server-derived from the authenticated NextAuth session:

1. Every game route calls `auth()` and returns 401 if the user is not authenticated.
2. `participantId` is resolved server-side via `findParticipantBySessionAndUser(gameSessionId, userId)`, never accepted from request bodies.
3. Host-only actions (start session, advance/skip rounds, finalize) check `participant.id === session.hostParticipantId || participant.role === 'HOST'` and return 403 if the caller is not the host.
4. `addParticipantToSession` uses Prisma upsert on the `@@unique([gameSessionId, userId])` key, ensuring idempotent join for authenticated users.
5. Guest identity is out of scope for this release. All game participants must be authenticated.

## Consequences
### Positive
- No caller can impersonate another participant or mutate a session they don't belong to.
- The game access pattern (`requireGameAccess`) is reusable across every game route.
- History and vocabulary detail routes are automatically scoped to the caller's own sessions.

### Negative
- Guest play is not supported. Any flow requiring anonymous participation needs an explicit capability token or server-side guest identity added separately.
- The existing history page relied on client-stored session IDs in localStorage/sessionStorage; those IDs are now validated against server-side membership, so stale entries silently disappear.
