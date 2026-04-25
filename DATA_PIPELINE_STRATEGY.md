# GoiFlow — Data Pipeline Strategy

> **Trạng thái:** Đã chốt — Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho chiến lược nạp dữ liệu nội dung của GoiFlow.

---

## Tổng quan

GoiFlow dùng một model duy nhất cho nội dung học tập:

| Loại nội dung | Mô tả | Model Prisma |
|---|---|---|
| **Goi (Vocabulary)** | Từ vựng tiếng Nhật (ví dụ: 図書館, 勉強, 学生) | `VocabEntry` |

Mỗi entry phải có **nghĩa tiếng Việt** (`meaningsVi`) và **âm Hán Việt** (`amHanViet`) — đây là giá trị cốt lõi khác biệt của GoiFlow so với các app học tiếng Nhật khác.

---

## Nguyên tắc bất di bất dịch

1. **Import once, query forever.** Dữ liệu được nạp vào PostgreSQL một lần qua script. App runtime chỉ query DB nội bộ, không bao giờ gọi external API khi người dùng đang chơi game.
2. **Không phụ thuộc runtime vào bất kỳ third-party API nào.** Jisho, Gemini, KanjiDictVN chỉ là nguồn để chạy script import trên máy developer. Nếu chúng sập, app vẫn hoạt động bình thường.
3. **Normalize trước khi serve.** Mọi dữ liệu external phải được chuẩn hóa sang schema nội bộ GoiFlow trước khi lưu vào DB.
4. **Dữ liệu chọn lọc tốt hơn dữ liệu thô đồ sộ.** Ưu tiên ~10.000 từ vựng JLPT thông dụng, có chất lượng cao, hơn là dump 200.000 từ lẫn lộn.

---

## Nguồn dữ liệu đã chốt

### 3 nguồn, mỗi nguồn một vai trò

| Nguồn | Vai trò | Dữ liệu lấy được | Ghi chú |
|---|---|---|---|
| **Jisho API** (`unofficial-jisho-api`) | Xương sống kỹ thuật | `word`, `reading` (hiragana), `jlptLevel`, `onyomi`, `kunyomi`, `strokeCount`, `radicals`, `meanings` (EN) | Rate limit — cần delay 500ms–1s giữa các request. Repo đã có local tại `c:\Users\ADMIN\Documents\Project\unofficial-jisho-api` |
| **KanjiDictVN** (`trungnt2910/KanjiDictVN`) | Âm Hán Việt | `amHanViet` cho từng chữ Kanji đơn | Download file tĩnh về `scripts/data/`. Dùng để enrich, không dùng runtime |
| **AI (Gemini API)** | Nghĩa tiếng Việt | `meaningsVi` cho cả cụm từ vựng (Goi) | Chạy batch dịch một lần. Cần vì không nguồn nào có sẵn nghĩa Việt cho từ ghép |

### Tại sao không dùng các nguồn khác?

| Nguồn bị loại | Lý do |
|---|---|
| Mazii / Laban API | Không phải public API, có thể đổi cấu trúc bất cứ lúc nào → app sập |
| EDICT (JMDict) | Phù hợp cho Library feature (Sprint 3), quá đồ sộ và không có tiếng Việt cho Sprint 1 |
| KanjiVG | Phù hợp cho Library stroke order animation (Sprint 3), không liên quan tới game data |
| Real-time fetch kiểu Kotobaweb | Chậm (200ms–1s mỗi request), không ổn định, không lưu được progress/history |

---

## Pipeline: 3 giai đoạn

### Giai đoạn 1 — INGEST (Nạp dữ liệu thô)

- Gọi Jisho API: `searchForPhrase()` hoặc `scrapeForPhrase()`
- Lấy: `word`, `reading`, `jlptLevel`, `meanings` (EN), `isCommon`
- Đọc file tĩnh KanjiDictVN (JSON/XML) vào bộ nhớ để dùng cho bước Enrich

### Giai đoạn 2 — ENRICH (Làm giàu)

- Tách từng chữ Kanji trong cụm từ → tra KanjiDictVN → ghép `amHanViet`
  - Ví dụ: `図書館` → 図=ĐỒ, 書=THƯ, 館=QUÁN → amHanViet = "Đồ Thư Quán"
- Gọi AI (Gemini) để dịch `meanings` (EN) → `meaningsVi` (VI) cho cả cụm từ
  - Ví dụ: `勉強` → EN: "Study" → AI dịch → VI: "Học tập"
  - **Không** ghép nghĩa từng chữ (勉=cố gắng + 強=mạnh ≠ "Học tập")

### Giai đoạn 3 — PERSIST (Lưu trữ)

- Dùng `prisma.vocabEntry.upsert()`
- Sinh `AcceptedAnswer` records cho gameplay (normalize readings)
- Đánh `sourceName` để tracking lineage
- Validate: mọi entry phải có `jlptLevel`, ít nhất 1 reading, ít nhất 1 meaning

---

## Ví dụ cụ thể: Từ "図書館"

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Jisho API                                           │
│   Input:  searchForPhrase("図書館")                          │
│   Output: word=図書館, reading=としょかん, jlpt=N5, en=Library │
├─────────────────────────────────────────────────────────────┤
│ STEP 2a: KanjiDictVN lookup                                 │
│   図 → ĐỒ                                                   │
│   書 → THƯ                                                   │
│   館 → QUÁN                                                  │
│   amHanViet = ["Đồ Thư Quán"]                               │
├─────────────────────────────────────────────────────────────┤
│ STEP 2b: AI Translation                                     │
│   Input:  "Translate '図書館' (Library) to Vietnamese"        │
│   Output: meaningsVi = ["Thư viện"]                          │
├─────────────────────────────────────────────────────────────┤
│ STEP 3: Prisma Upsert → VocabEntry                          │
│   term: 図書館                                               │
│   reading: としょかん                                         │
│   jlptLevel: N5                                              │
│   meaningsVi: ["Thư viện"]                                   │
│   amHanViet: ["Đồ Thư Quán"]                                │
│   sourceName: JISHO_API                                      │
│   + AcceptedAnswer { normalizedValue: "としょかん" }           │
└─────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc file trong repo

```
scripts/
├── data/
│   └── kanji-vn-source.json     # File tĩnh từ KanjiDictVN (âm Hán Việt cho enrich)
├── import-vocab.ts              # Pipeline cho VocabEntry (Goi)
└── seed-kanji.ts                # ← Script cũ (hardcoded, sẽ bị thay thế)
```

---

## Enum cần bổ sung

```prisma
enum ContentSourceName {
  INTERNAL_SEED   // Dữ liệu hardcoded cũ
  JISHO_API       // Dữ liệu từ Jisho import pipeline
  KANJI_DICT_VN   // Dữ liệu từ KanjiDictVN
}
```

---

## Mục tiêu coverage Sprint 1

| Level | VocabEntry (ước tính) |
|---|---|
| N5 | ~800 |
| N4 | ~1,500 |
| **Tổng Sprint 1** | **~2,300** |

Các level N3, N2, N1 sẽ được bổ sung dần ở các sprint sau khi pipeline đã ổn định.

---

## Lưu ý khi implement

1. **Rate limiting Jisho:** Thêm `await delay(1000)` giữa mỗi request. Với 2.300 từ, script sẽ mất ~40 phút.
2. **Rate limiting Gemini:** Kiểm tra quota free tier. Có thể cần batch 100 từ/request thay vì 1 từ/request.
3. **Idempotent:** Script phải dùng `upsert` để có thể chạy lại nhiều lần mà không tạo duplicate.
4. **Error recovery:** Lưu progress vào file (ví dụ: `scripts/data/.import-progress.json`) để resume nếu script bị crash giữa chừng.
5. **Kunyomi normalization:** Jisho trả về `た.べる` → cần strip dấu chấm thành `たべる` trước khi lưu vào `AcceptedAnswer`.
6. **Validation:** Reject entry nếu thiếu `jlptLevel` hoặc không có reading nào.

---

## Liên kết tài liệu

- [ADR-0001: Internal normalized content store](docs/adr/0001-internal-normalized-content-store.md)
- [PROJECT_ROADMAP_4_SPRINTS.md](PROJECT_ROADMAP_4_SPRINTS.md) — Xem mục "Data source strategy"
- [Prisma Schema](prisma/schema.prisma) — Model: `VocabEntry`, `AcceptedAnswer`
- [unofficial-jisho-api README](../unofficial-jisho-api/README.md) — API reference cho Jisho wrapper
