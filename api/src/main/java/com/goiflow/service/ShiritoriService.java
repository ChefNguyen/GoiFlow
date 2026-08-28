package com.goiflow.service;

import com.goiflow.dto.request.CreateShiritoriRequest;
import com.goiflow.dto.request.JoinShiritoriRequest;
import com.goiflow.dto.request.SubmitShiritoriWordRequest;
import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.enums.GameMode;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.ParticipantRole;
import com.goiflow.repository.GameParticipantRepository;
import com.goiflow.repository.GameSessionRepository;
import com.goiflow.repository.VocabularyEntryRepository;
import com.goiflow.util.CuidUtils;
import com.goiflow.util.ShiritoriKanaUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiritoriService {

    private final GameSessionRepository gameSessionRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final RedisCacheService redisCacheService;

    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String[] BOT_NAMES = {
            "Aoi-Bot", "Kenji-Bot", "Sakura-Bot", "Ren-Bot",
            "Yuki-Bot", "Daiki-Bot", "Hana-Bot", "Kaito-Bot"
    };

    // In-memory state cache for fast, high-frequency Shiritori turns
    private final Map<String, ShiritoriState> sessionStates = new ConcurrentHashMap<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShiritoriWordItem {
        private String id;
        private String word;
        private String reading;
        private String romaji;
        private String meaning;
        private String participantId;
        private String participantName;
        private String participantAvatarUrl;
        private Boolean isBot;
        private LocalDateTime submittedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShiritoriParticipant {
        private String id;
        private String displayName;
        private String userId;
        private String avatarUrl;
        private Boolean isBot;
        private Boolean isEliminated;
        private Integer wordsCount;
        private Integer totalScore;
        private Integer rank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShiritoriState {
        private String sessionId;
        private String roomCode;
        private Integer timePerTurn;
        private Integer botPlayers;
        private GameSessionStatus status;
        private String currentWord;
        private String currentReading;
        private String currentRomaji;
        private String currentMeaning;
        private String lastKana;
        private Integer chainLength;
        private String turnParticipantId;
        private LocalDateTime turnDeadline;
        private String winnerParticipantId;
        private String winnerName;
        @Builder.Default
        private List<ShiritoriWordItem> chainHistory = new ArrayList<>();
        @Builder.Default
        private List<ShiritoriParticipant> participants = new ArrayList<>();
        @Builder.Default
        private Set<String> usedWords = new HashSet<>();
        private LocalDateTime lastBotTurnAt;
    }

    public List<ShiritoriWordItem> getChainHistoryForSession(String sessionId) {
        if (sessionId == null) return Collections.emptyList();
        ShiritoriState state = sessionStates.get(sessionId);
        if (state == null) return Collections.emptyList();
        synchronized (state) {
            return new ArrayList<>(state.getChainHistory());
        }
    }

    @Transactional
    public Map<String, Object> createSession(CreateShiritoriRequest request) {
        String roomCode = generateUniqueRoomCode();
        String sessionId = CuidUtils.generate();

        GameSessionEntity session = GameSessionEntity.builder()
                .id(sessionId)
                .roomCode(roomCode)
                .gameMode(GameMode.SHIRITORI)
                .jlptLevel(com.goiflow.enums.JlptLevel.N5)
                .status(GameSessionStatus.IN_PROGRESS)
                .isPrivate(Boolean.TRUE.equals(request.getIsPrivate()))
                .timePerPromptSeconds(request.getTimePerTurn() != null ? request.getTimePerTurn() : 15)
                .maxRounds(50)
                .currentRoundNumber(1)
                .startedAt(LocalDateTime.now())
                .build();

        String hostParticipantId = CuidUtils.generate();
        GameParticipantEntity host = GameParticipantEntity.builder()
                .id(hostParticipantId)
                .gameSessionId(sessionId)
                .userId(request.getUserId())
                .displayName(request.getDisplayName() != null && !request.getDisplayName().isBlank()
                        ? request.getDisplayName().trim()
                        : "Player")
                .role(ParticipantRole.HOST)
                .joinedAt(LocalDateTime.now())
                .build();

        session.setHostParticipantId(hostParticipantId);
        gameSessionRepository.save(session);
        gameParticipantRepository.save(host);

        // Initialize Participants (Host + Bots)
        List<ShiritoriParticipant> participantList = new ArrayList<>();
        participantList.add(ShiritoriParticipant.builder()
                .id(hostParticipantId)
                .displayName(host.getDisplayName())
                .userId(request.getUserId())
                .avatarUrl(request.getAvatarUrl())
                .isBot(false)
                .isEliminated(false)
                .wordsCount(0)
                .totalScore(0)
                .rank(1)
                .build());

        int botCount = request.getBotPlayers() != null ? Math.min(8, Math.max(0, request.getBotPlayers())) : 2;
        for (int i = 0; i < botCount; i++) {
            String botId = "bot_" + CuidUtils.generate().substring(0, 8);
            String botName = BOT_NAMES[i % BOT_NAMES.length];
            participantList.add(ShiritoriParticipant.builder()
                    .id(botId)
                    .displayName(botName)
                    .isBot(true)
                    .isEliminated(false)
                    .wordsCount(0)
                    .totalScore(0)
                    .rank(1)
                    .build());
        }

        // Pick Random Starter Word (via Redis Set O(1) with DB fallback)
        VocabularyEntryEntity starterWord = null;
        String starterWordId = redisCacheService.getRandomStarterWordId();
        if (starterWordId != null) {
            starterWord = redisCacheService.getCachedVocabularyEntry(starterWordId);
            if (starterWord == null) {
                starterWord = vocabularyEntryRepository.findById(starterWordId).orElse(null);
                if (starterWord != null) redisCacheService.cacheVocabularyEntry(starterWord);
            }
        }
        if (starterWord == null) {
            starterWord = vocabularyEntryRepository.findRandomStarterWord();
        }
        String initialTerm = starterWord != null ? starterWord.getTerm() : "りんご";
        String initialReading = starterWord != null ? starterWord.getReading() : "りんご";
        String initialMeaning = starterWord != null && starterWord.getMeaningsVi() != null && !starterWord.getMeaningsVi().isEmpty()
                ? starterWord.getMeaningsVi().get(0)
                : "Quả táo";
        String initialLastKana = ShiritoriKanaUtils.getLastKana(initialReading);

        Set<String> used = new HashSet<>();
        used.add(ShiritoriKanaUtils.toHiragana(initialReading));
        used.add(initialTerm);

        List<ShiritoriWordItem> history = new ArrayList<>();
        history.add(ShiritoriWordItem.builder()
                .id(CuidUtils.generate())
                .word(initialTerm)
                .reading(initialReading)
                .meaning(initialMeaning)
                .participantId(null)
                .participantName("Game Master")
                .isBot(false)
                .submittedAt(LocalDateTime.now())
                .build());

        int turnDuration = session.getTimePerPromptSeconds();
        ShiritoriState state = ShiritoriState.builder()
                .sessionId(sessionId)
                .roomCode(roomCode)
                .timePerTurn(turnDuration)
                .botPlayers(botCount)
                .status(GameSessionStatus.IN_PROGRESS)
                .currentWord(initialTerm)
                .currentReading(initialReading)
                .currentMeaning(initialMeaning)
                .lastKana(initialLastKana)
                .chainLength(1)
                .turnParticipantId(hostParticipantId)
                .turnDeadline(LocalDateTime.now().plusSeconds(turnDuration))
                .chainHistory(history)
                .participants(participantList)
                .usedWords(used)
                .build();

        sessionStates.put(sessionId, state);

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", sessionId);
        resp.put("roomCode", roomCode);
        resp.put("participantId", hostParticipantId);
        return resp;
    }

    @Transactional
    public Map<String, Object> joinSession(JoinShiritoriRequest request) {
        String cleanCode = request.getRoomCode().trim().toUpperCase();
        GameSessionEntity session = gameSessionRepository.findByRoomCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + cleanCode));

        ShiritoriState state = sessionStates.get(session.getId());
        String participantId = CuidUtils.generate();
        String name = request.getDisplayName() != null && !request.getDisplayName().isBlank()
                ? request.getDisplayName().trim()
                : "Player";

        GameParticipantEntity participant = GameParticipantEntity.builder()
                .id(participantId)
                .gameSessionId(session.getId())
                .userId(request.getUserId())
                .displayName(name)
                .role(ParticipantRole.PLAYER)
                .joinedAt(LocalDateTime.now())
                .build();
        gameParticipantRepository.save(participant);

        if (state != null) {
            synchronized (state) {
                state.getParticipants().add(ShiritoriParticipant.builder()
                        .id(participantId)
                        .displayName(name)
                        .userId(request.getUserId())
                        .avatarUrl(request.getAvatarUrl())
                        .isBot(false)
                        .isEliminated(false)
                        .wordsCount(0)
                        .totalScore(0)
                        .rank(state.getParticipants().size() + 1)
                        .build());
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("sessionId", session.getId());
        resp.put("roomCode", session.getRoomCode());
        resp.put("participantId", participantId);
        return resp;
    }

    public Map<String, Object> getSessionState(String sessionId, String callerParticipantId) {
        ShiritoriState state = sessionStates.get(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Active Shiritori session not found");
        }

        synchronized (state) {
            // Check timeout & process bot move if applicable
            checkTurnTimeout(state);
            processBotTurnIfCurrent(state);

            // Recompute standings
            recomputeRanks(state);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("sessionId", state.getSessionId());
            map.put("roomCode", state.getRoomCode());
            map.put("timePerTurn", state.getTimePerTurn());
            map.put("status", state.getStatus().name());
            map.put("currentWord", state.getCurrentWord());
            map.put("currentReading", state.getCurrentReading());
            map.put("currentMeaning", state.getCurrentMeaning());
            map.put("lastKana", state.getLastKana());
            map.put("chainLength", state.getChainLength());
            map.put("turnParticipantId", state.getTurnParticipantId());
            map.put("turnRemainingSeconds", Math.max(0, (int) ChronoUnit.SECONDS.between(LocalDateTime.now(), state.getTurnDeadline())));
            map.put("isYourTurn", callerParticipantId != null && callerParticipantId.equals(state.getTurnParticipantId()));
            map.put("winnerParticipantId", state.getWinnerParticipantId());
            map.put("winnerName", state.getWinnerName());
            map.put("participants", state.getParticipants());
            map.put("chainHistory", state.getChainHistory());
            return map;
        }
    }

    public Map<String, Object> submitWord(String sessionId, SubmitShiritoriWordRequest request) {
        ShiritoriState state = sessionStates.get(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Session not found");
        }

        synchronized (state) {
            if (state.getStatus() == GameSessionStatus.FINISHED) {
                throw new IllegalStateException("Game has already finished");
            }

            if (!Objects.equals(state.getTurnParticipantId(), request.getParticipantId())) {
                throw new IllegalArgumentException("It is not your turn!");
            }

            String input = request.getWord() != null ? request.getWord().trim() : "";
            if (input.isEmpty()) {
                throw new IllegalArgumentException("Word cannot be empty");
            }

            // 1. Dictionary lookup
            List<VocabularyEntryEntity> entries = vocabularyEntryRepository.findByTermOrReading(input);
            if (entries.isEmpty()) {
                throw new IllegalArgumentException("Word '" + input + "' not found in Japanese dictionary");
            }

            VocabularyEntryEntity matched = entries.get(0);
            String term = matched.getTerm();
            String reading = matched.getReading();
            String meaning = matched.getMeaningsVi() != null && !matched.getMeaningsVi().isEmpty()
                    ? matched.getMeaningsVi().get(0)
                    : "";

            // 2. Validate starting kana against last kana of previous word
            String startKana = ShiritoriKanaUtils.getFirstKana(reading);
            if (!ShiritoriKanaUtils.matchesKana(startKana, state.getLastKana())) {
                throw new IllegalArgumentException("Word must start with '" + state.getLastKana() + "' (got '" + startKana + "')");
            }

            // 3. Validate word has not been repeated
            String normalizedReading = ShiritoriKanaUtils.toHiragana(reading);
            if (state.getUsedWords().contains(normalizedReading) || state.getUsedWords().contains(term)) {
                throw new IllegalArgumentException("Word '" + term + "' has already been used in this chain!");
            }

            ShiritoriParticipant currentParticipant = findParticipant(state, request.getParticipantId());

            // 4. Check if word ends with 'ん' -> Elimination / Game Over
            if (ShiritoriKanaUtils.endsWithN(reading)) {
                if (currentParticipant != null) {
                    currentParticipant.setIsEliminated(true);
                }
                advanceToNextActiveParticipant(state);
                checkGameOver(state);

                Map<String, Object> resp = new HashMap<>();
                resp.put("success", false);
                resp.put("eliminated", true);
                resp.put("message", "Word ended in 'ん' (N)! You have been eliminated.");
                return resp;
            }

            // 5. Successful word submission!
            state.getUsedWords().add(normalizedReading);
            state.getUsedWords().add(term);

            String nextLastKana = ShiritoriKanaUtils.getLastKana(reading);
            state.setCurrentWord(term);
            state.setCurrentReading(reading);
            state.setCurrentMeaning(meaning);
            state.setLastKana(nextLastKana);
            state.setChainLength(state.getChainLength() + 1);

            if (currentParticipant != null) {
                currentParticipant.setWordsCount(currentParticipant.getWordsCount() + 1);
                currentParticipant.setTotalScore(currentParticipant.getTotalScore() + 10);
            }

            state.getChainHistory().add(0, ShiritoriWordItem.builder()
                    .id(CuidUtils.generate())
                    .word(term)
                    .reading(reading)
                    .meaning(meaning)
                    .participantId(request.getParticipantId())
                    .participantName(currentParticipant != null ? currentParticipant.getDisplayName() : "Player")
                    .participantAvatarUrl(currentParticipant != null ? currentParticipant.getAvatarUrl() : null)
                    .isBot(currentParticipant != null && Boolean.TRUE.equals(currentParticipant.getIsBot()))
                    .submittedAt(LocalDateTime.now())
                    .build());

            advanceToNextActiveParticipant(state);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("word", term);
            resp.put("nextKana", nextLastKana);
            return resp;
        }
    }

    public Map<String, Object> restartSession(String sessionId, String callerParticipantId) {
        ShiritoriState state = sessionStates.get(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Session not found");
        }

        synchronized (state) {
            VocabularyEntryEntity starterWord = vocabularyEntryRepository.findRandomStarterWord();
            String initialTerm = starterWord != null ? starterWord.getTerm() : "りんご";
            String initialReading = starterWord != null ? starterWord.getReading() : "りんご";
            String initialMeaning = starterWord != null && starterWord.getMeaningsVi() != null && !starterWord.getMeaningsVi().isEmpty()
                    ? starterWord.getMeaningsVi().get(0)
                    : "Quả táo";
            String initialLastKana = ShiritoriKanaUtils.getLastKana(initialReading);

            Set<String> used = new HashSet<>();
            used.add(ShiritoriKanaUtils.toHiragana(initialReading));
            used.add(initialTerm);

            List<ShiritoriWordItem> history = new ArrayList<>();
            history.add(ShiritoriWordItem.builder()
                    .id(CuidUtils.generate())
                    .word(initialTerm)
                    .reading(initialReading)
                    .meaning(initialMeaning)
                    .participantId(null)
                    .participantName("Game Master")
                    .isBot(false)
                    .submittedAt(LocalDateTime.now())
                    .build());

            for (ShiritoriParticipant p : state.getParticipants()) {
                p.setIsEliminated(false);
                p.setWordsCount(0);
                p.setTotalScore(0);
                p.setRank(1);
            }

            String firstTurnId = callerParticipantId != null ? callerParticipantId :
                    (!state.getParticipants().isEmpty() ? state.getParticipants().get(0).getId() : null);

            state.setStatus(GameSessionStatus.IN_PROGRESS);
            state.setCurrentWord(initialTerm);
            state.setCurrentReading(initialReading);
            state.setCurrentMeaning(initialMeaning);
            state.setLastKana(initialLastKana);
            state.setChainLength(1);
            state.setTurnParticipantId(firstTurnId);
            state.setTurnDeadline(LocalDateTime.now().plusSeconds(state.getTimePerTurn()));
            state.setWinnerParticipantId(null);
            state.setWinnerName(null);
            state.setChainHistory(history);
            state.setUsedWords(used);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("sessionId", sessionId);
            return resp;
        }
    }

    private void checkTurnTimeout(ShiritoriState state) {
        if (state.getStatus() == GameSessionStatus.FINISHED) return;
        if (LocalDateTime.now().isAfter(state.getTurnDeadline())) {
            ShiritoriParticipant current = findParticipant(state, state.getTurnParticipantId());
            if (current != null) {
                // If human player times out, mark them eliminated in survival mode
                current.setIsEliminated(true);
            }
            advanceToNextActiveParticipant(state);
            checkGameOver(state);
        }
    }

    private void processBotTurnIfCurrent(ShiritoriState state) {
        if (state.getStatus() == GameSessionStatus.FINISHED) return;
        ShiritoriParticipant current = findParticipant(state, state.getTurnParticipantId());
        if (current == null || !Boolean.TRUE.equals(current.getIsBot()) || Boolean.TRUE.equals(current.getIsEliminated())) {
            return;
        }

        // Simulate natural delay for bot thinking (at least 1.5s after turn start)
        long secondsElapsed = ChronoUnit.SECONDS.between(state.getTurnDeadline().minusSeconds(state.getTimePerTurn()), LocalDateTime.now());
        if (secondsElapsed < 1) {
            return;
        }

        // Query words starting with lastKana
        List<VocabularyEntryEntity> candidateWords = vocabularyEntryRepository.findWordsStartingWith(state.getLastKana(), 30);
        VocabularyEntryEntity chosen = null;

        for (VocabularyEntryEntity v : candidateWords) {
            String norm = ShiritoriKanaUtils.toHiragana(v.getReading());
            if (!state.getUsedWords().contains(norm) && !state.getUsedWords().contains(v.getTerm())) {
                chosen = v;
                break;
            }
        }

        if (chosen == null) {
            // Bot cannot find a word -> eliminated
            current.setIsEliminated(true);
            advanceToNextActiveParticipant(state);
            checkGameOver(state);
            return;
        }

        String term = chosen.getTerm();
        String reading = chosen.getReading();
        String meaning = chosen.getMeaningsVi() != null && !chosen.getMeaningsVi().isEmpty()
                ? chosen.getMeaningsVi().get(0)
                : "";

        state.getUsedWords().add(ShiritoriKanaUtils.toHiragana(reading));
        state.getUsedWords().add(term);

        String nextLastKana = ShiritoriKanaUtils.getLastKana(reading);
        state.setCurrentWord(term);
        state.setCurrentReading(reading);
        state.setCurrentMeaning(meaning);
        state.setLastKana(nextLastKana);
        state.setChainLength(state.getChainLength() + 1);

        current.setWordsCount(current.getWordsCount() + 1);
        current.setTotalScore(current.getTotalScore() + 10);

        state.getChainHistory().add(0, ShiritoriWordItem.builder()
                .id(CuidUtils.generate())
                .word(term)
                .reading(reading)
                .meaning(meaning)
                .participantId(current.getId())
                .participantName(current.getDisplayName())
                .isBot(true)
                .submittedAt(LocalDateTime.now())
                .build());

        state.setLastBotTurnAt(LocalDateTime.now());
        advanceToNextActiveParticipant(state);
        checkGameOver(state);
    }

    private void advanceToNextActiveParticipant(ShiritoriState state) {
        List<ShiritoriParticipant> active = state.getParticipants().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsEliminated()))
                .toList();

        if (active.isEmpty()) {
            checkGameOver(state);
            return;
        }

        int currentIndex = -1;
        for (int i = 0; i < active.size(); i++) {
            if (active.get(i).getId().equals(state.getTurnParticipantId())) {
                currentIndex = i;
                break;
            }
        }

        int nextIndex = (currentIndex + 1) % active.size();
        state.setTurnParticipantId(active.get(nextIndex).getId());
        state.setTurnDeadline(LocalDateTime.now().plusSeconds(state.getTimePerTurn()));
    }

    private void checkGameOver(ShiritoriState state) {
        List<ShiritoriParticipant> active = state.getParticipants().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsEliminated()))
                .toList();

        if (active.size() <= 1 && state.getParticipants().size() > 1) {
            state.setStatus(GameSessionStatus.FINISHED);
            if (!active.isEmpty()) {
                state.setWinnerParticipantId(active.get(0).getId());
                state.setWinnerName(active.get(0).getDisplayName());
            }
        }
    }

    private void recomputeRanks(ShiritoriState state) {
        List<ShiritoriParticipant> sorted = new ArrayList<>(state.getParticipants());
        sorted.sort((a, b) -> {
            int scoreCmp = Integer.compare(b.getTotalScore(), a.getTotalScore());
            if (scoreCmp != 0) return scoreCmp;
            return Integer.compare(b.getWordsCount(), a.getWordsCount());
        });

        int currentRank = 1;
        for (int i = 0; i < sorted.size(); i++) {
            ShiritoriParticipant p = sorted.get(i);
            if (i > 0) {
                ShiritoriParticipant prev = sorted.get(i - 1);
                boolean isTied = prev.getTotalScore().equals(p.getTotalScore()) &&
                                 prev.getWordsCount().equals(p.getWordsCount());
                if (!isTied) {
                    currentRank = i + 1;
                }
            }
            p.setRank(currentRank);
        }
    }

    private ShiritoriParticipant findParticipant(ShiritoriState state, String participantId) {
        if (participantId == null) return null;
        return state.getParticipants().stream()
                .filter(p -> p.getId().equals(participantId))
                .findFirst()
                .orElse(null);
    }

    private String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(ROOM_CODE_CHARS.charAt(RANDOM.nextInt(ROOM_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (gameSessionRepository.findByRoomCode(code).isEmpty()) {
                return code;
            }
        }
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
