# ADR 0001: Internal normalized content store for GoiFlow learning content

## Status
Accepted

## Date
2026-04-20

## Context
GoiFlow cần phục vụ các trải nghiệm học Goi và Kanji theo JLPT, đồng thời hỗ trợ localized content như nghĩa tiếng Việt và âm Hán Việt. Các external dataset hoặc API có thể cung cấp dữ liệu thô ban đầu, nhưng schema của chúng không phản ánh đầy đủ nhu cầu sản phẩm.

Core gameplay, library, history, và profile cũng không nên phụ thuộc runtime vào third-party API. Ứng dụng cần một content store nội bộ ổn định, query được theo level, phân trang được, và có thể enrich thêm metadata phục vụ gameplay.

## Decision
GoiFlow sẽ dùng PostgreSQL qua Prisma làm content store chính cho Goi và Kanji.

External dataset/API chỉ đóng vai trò upstream raw input cho import pipeline. Mọi dữ liệu external phải được normalize vào schema nội bộ của GoiFlow trước khi dùng ở runtime.

Schema nội bộ phải coi các field sau là first-class:
- `jlptLevel`
- `meanings`
- `meaningsVi`
- `amHanViet`
- normalized readings/answers phục vụ gameplay
- source lineage để theo dõi import

## Planned schema shape

### Shared enums
- `JlptLevel`: `N5`, `N4`, `N3`, `N2`, `N1`
- `ContentSourceName`: tên source upstream đã chọn sau
- `PromptType`: `KANJI_TO_READING`, `WORD_TO_READING`, `READING_TO_MEANING`

### Kanji content
`KanjiEntry`
- `id`
- `character`
- `jlptLevel`
- `strokes`
- `radicals`
- `meanings`
- `meaningsVi`
- `onyomi`
- `kunyomi`
- `amHanViet`
- `normalizedSearch`
- `difficultyWeight`
- `isCommon`
- `sourceName`
- `sourceRecordId`
- `importVersion`
- `normalizedAt`
- timestamps

### Vocabulary content
`VocabularyEntry`
- `id`
- `term`
- `reading`
- `jlptLevel`
- `partOfSpeech`
- `meaningsVi`
- `amHanViet`
- `exampleSentence`
- `difficultyWeight`
- `isCommon`
- `lessonGroup`
- `normalizedSearch`
- `sourceName`
- `sourceRecordId`
- `importVersion`
- `normalizedAt`
- timestamps

### Gameplay normalization
`AcceptedAnswer`
- `id`
- `promptType`
- `normalizedValue`
- `displayValue`
- `kanjiEntryId?`
- `vocabularyEntryId?`
- timestamps

Mục đích của bảng answer normalization là tách accepted answers khỏi raw source fields để gameplay có thể so khớp ổn định với hiragana, romaji, hoặc các biến thể đã normalize.

## Normalization rules
1. Ingest raw records từ external source hoặc source files.
2. Map vào schema nội bộ theo loại content: kanji hoặc vocabulary.
3. Enrich localized fields như `meaningsVi` và `amHanViet`.
4. Sinh normalized search text và accepted answers cho gameplay.
5. Validate record bắt buộc có level, reading hoặc meaning phù hợp với loại content.
6. Persist vào DB nội bộ, sau đó runtime chỉ query từ DB này.

## Runtime serving rules
- Client không fetch trực tiếp từ external dataset/API.
- App routes và server actions chỉ gọi repository/service nội bộ trong `src/server`.
- Query content phải hỗ trợ filter theo `jlptLevel` và load theo chunk nhỏ.
- Kanji Game Sprint 1 chỉ cần coverage nội dung N5 đến N4.

## Consequences
### Positive
- Runtime ổn định, không phụ thuộc public API.
- Content schema bám đúng mục tiêu học tập của GoiFlow.
- Library và gameplay có thể share cùng source of truth.
- Có lineage để re-import hoặc refresh dữ liệu an toàn hơn.

### Negative
- Cần xây import pipeline riêng.
- Cần quyết định external source và mapping rõ ràng.
- Tăng chi phí maintain content schema nội bộ.

## Sprint 1 implications
Sprint 1 cần làm tối thiểu các phần sau:
1. Thêm enums và content models vào Prisma.
2. Thêm repository/service query content theo `jlptLevel`.
3. Viết script ingest/normalize/import cho coverage N5 đến N4.
4. Dùng content store nội bộ để cấp dữ liệu round cho Kanji Game.
