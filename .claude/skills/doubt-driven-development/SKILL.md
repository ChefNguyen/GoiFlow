---
name: doubt-driven-development
description: Adversarial fresh-context review of every non-trivial decision in-flight. Use when stakes are high (auth, scoring, schema change), working in unfamiliar code, or when confident output needs cross-examination.
---

# Doubt-Driven Development — GoiFlow

## Overview

Stop. Cross-examine every non-trivial decision before committing to it. The pattern: make a claim, extract the key assumptions, apply adversarial doubt, then reconcile. For GoiFlow's high-stakes surfaces (auth, scoring, DB schema, answer normalization), the cost of verifying now is always lower than debugging in production.

## When to Use

- About to change auth/session validation logic
- Adding or modifying Prisma schema (irreversible migration)
- Changing answer normalization or scoring logic (affects persisted GameResult)
- Working in unfamiliar service or repository code
- A confident implementation feels "obvious" but hasn't been cross-examined

## The CEDR Process

For every non-trivial decision:

### 1. CLAIM
State what you're about to do and why:
```
CLAIM: I will validate participantId ownership by checking if the participant
exists in the session before processing the submission.
``` 

### 2. EXTRACT
List the key assumptions behind the claim:
```
ASSUMPTIONS:
1. participantId comes from the client and is not trustworthy
2. A single Prisma query checking gameSessionId + participantId is sufficient
3. The session status doesn't need to be checked (it could be FINISHED)
```

### 3. DOUBT
Challenge each assumption adversarially:
```
DOUBTS:
1. What if the participantId belongs to a different session? (IDOR risk)
2. What if the session is FINISHED — should we still allow submission?
3. What if two submissions race for the same round? (duplicate submission)
```

### 4. RECONCILE
Resolve each doubt with evidence from code, spec, or schema:
```
RECONCILE:
1. Query: { where: { id: participantId, gameSessionId: sessionId } } — covers IDOR
2. Check session.status === 'IN_PROGRESS' before accepting submission
3. The @@unique([gameRoundId, participantId]) constraint on GameSubmission prevents duplicates at DB level
```

### 5. STOP (if unresolved)
If a doubt cannot be resolved, STOP and surface it to the user:
```
UNRESOLVED: The spec doesn't define behavior when a player submits after the session FINISHES
(e.g., race condition between last submission and results computation).
→ Which should win: the submission or the FINISHED state?
```

## GoiFlow High-Stakes Surfaces

Always apply CEDR when touching:

| Surface | Why it's high-stakes |
|---------|---------------------|
| `GameSubmission` creation | Affects score, GameResult, round advancement |
| `GameSession` status transitions | WAITING→IN_PROGRESS→FINISHED is irreversible in practice |
| Answer normalization (`normalizedAnswer`) | Stored in DB, determines isCorrect — wrong = silent score corruption |
| `GameResult` computation | Persisted rank/score — wrong = misleading results page |
| Auth.js session / `participantId` validation | Security boundary — wrong = IDOR |
| Prisma schema migrations | Irreversible structural change |
| Content selection (`KanjiEntry`/`VocabularyEntry` query) | Wrong jlptLevel filter = wrong difficulty for learner |

## Verification

Before proceeding after CEDR:
- [ ] All assumptions are explicitly stated
- [ ] Each assumption has been challenged
- [ ] Each doubt is resolved with evidence OR surfaced to the user
- [ ] No "it should be fine" resolutions — only "the schema constraint guarantees..." or "the spec says..."
