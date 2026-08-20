# GoiFlow — Product Documentation

## Authenticated Vocabulary Game

The core product is a multiplayer vocabulary-learning game:
1. **Sign in** via OAuth (Google, Facebook) or email+password+OTP.
2. **Create or join** a game room as an authenticated user.
3. **Host starts** the session; all members see a kanji/vocabulary prompt and enter the hiragana reading.
4. **Answer scoring**: correct answers award points; 3 incorrect attempts automatically advance the round.
5. **Results** are computed and persisted when the host finalizes; standings show rank, score, and accuracy.
6. **History & Profile**: XP, level/rank, streak, and study heatmap are computed from all finished sessions.

### Library
Browse vocabulary entries filtered by JLPT level. Search by term or reading. Paginated, backed by the content store (VocabularyEntry table).

### Global Leaderboard
Aggregated scores from all authenticated participants across finished sessions. Top 50 players ranked by total score.

## Key Architectural Decisions
- Game participant identity is **server-derived from the authenticated session**, never from client-supplied identifiers (ADR-0002).
- Content is stored in a normalized internal database, not fetched from external APIs at runtime (ADR-0001).
- Guest play is out of scope for the current release.
