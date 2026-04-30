# 🌊 GoiFlow — Data Pipeline Strategy

> 📌 **Trạng thái:** Đã chốt — Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho chiến lược nạp dữ liệu nội dung của GoiFlow.

---

## 🎯 Tổng quan

GoiFlow dùng một model nội bộ chuẩn hóa cho nội dung học tập:

| Loại nội dung | Mô tả | Model Prisma |
|:---|:---|:---|
| 📚 **Goi (Vocabulary)** | Từ vựng tiếng Nhật (ví dụ: 図書館, 勉強, 学生) | `VocabularyEntry` |

> 💡 **Core Value:** Mỗi entry phải có **nghĩa tiếng Việt** (`meaningsVi`) và **âm Hán Việt** (`amHanViet`) — đây là giá trị cốt lõi khác biệt của GoiFlow so với các app học tiếng Nhật khác.

---

## 🛡️ Nguyên tắc bất di bất dịch

1. 📥 **Import once, query forever.** Dữ liệu được nạp vào PostgreSQL một lần qua script. App runtime chỉ query DB nội bộ, không bao giờ gọi external API khi người dùng đang chơi game.
2. 🛑 **Batch/script-time only, never runtime.** Jisho, Gemini/Google Gen AI, KanjiDictVN chỉ được dùng trong pipeline import/enrich offline. Nếu các nguồn này sập, app vẫn hoạt động bình thường bằng dữ liệu đã materialize trong DB.
3. 🧹 **Normalize trước khi serve.** Mọi dữ liệu external phải được chuẩn hóa sang schema nội bộ GoiFlow trước khi lưu vào DB.
4. 💎 **Dữ liệu chọn lọc tốt hơn dữ liệu thô đồ sộ.** Ưu tiên ~10.000 từ vựng JLPT thông dụng, có chất lượng cao, hơn là dump 200.000 từ lẫn lộn.

---

## 📡 Nguồn dữ liệu đã chốt

### 🔄 3 nguồn, mỗi nguồn một vai trò

| Nguồn | Vai trò | Dữ liệu lấy được | Ghi chú |
|:---|:---|:---|:---|
| 📖 **Jisho API** (`unofficial-jisho-api`) | Xương sống ingest | `term`, `reading` (hiragana), `jlptLevel`, `partOfSpeech`, `isCommon`, `meanings` (EN) | ⏱️ Rate limit 500ms–1s/request. Jisho không phải nguồn authority cho `meaningsVi` hoặc `amHanViet`. |
| 🈴 **KanjiDictVN** (`trungnt2910/KanjiDictVN`) | Nguồn authority cho âm Hán Việt | `amHanViet` cho từng chữ Kanji đơn | 📥 Download file tĩnh về `scripts/data/`. Dùng để enrich offline, không dùng runtime. |
| 🤖 **Gemini / Google Gen AI** | Nghĩa tiếng Việt | `meaningsVi` cho cả cụm từ vựng (Goi) | ⚡ Chạy batch để materialize nghĩa Việt từ EN meanings + context. Không dùng để đoán `amHanViet`. |

### ❌ Tại sao không dùng các nguồn khác?

| Nguồn bị loại | Lý do |
|:---|:---|
| 🚫 Mazii / Laban API | Không phải public API, có thể đổi cấu trúc bất cứ lúc nào → app sập |
| 📚 EDICT (JMDict) | Phù hợp cho Library feature sau này, quá đồ sộ và không có tiếng Việt cho Sprint 1 |
| 🖌️ KanjiVG | Phù hợp cho Library stroke order animation, không liên quan trực tiếp tới game data |
| ⏳ Real-time fetch kiểu Kotobaweb | Chậm (200ms–1s mỗi request), không ổn định, phá nguyên tắc import once/query forever |

---

## ⚙️ Pipeline: 3 giai đoạn

### 🏗️ Giai đoạn 1 — INGEST (Nạp dữ liệu gốc)

- 🔍 Gọi Jisho qua `unofficial-jisho-api`: `searchForPhrase()` hoặc `scrapeForPhrase()`.
- 📦 Lấy dữ liệu gốc: `term`, `reading`, `jlptLevel`, `partOfSpeech`, `isCommon`, `meanings` (EN).
- 🧠 Đọc file tĩnh KanjiDictVN vào bộ nhớ để dùng cho bước enrich.
- ✅ **Trạng thái hiện tại:** `scripts/import-vocab.ts` đã có nền tảng `file`/`jisho` ingest, `--dry-run`, progress/resume, retry/backoff và idempotent upsert.

### ✨ Giai đoạn 2 — ENRICH (Làm giàu)

- 🈴 **Enrich `amHanViet` bằng KanjiDictVN:** tách từng chữ Kanji trong `term`, tra KanjiDictVN, rồi ghép theo thứ tự xuất hiện.
  - *Ví dụ:* `図書館` → 図=ĐỒ, 書=THƯ, 館=QUÁN → `amHanViet = ["Đồ Thư Quán"]`.
  - ⚠️ Nếu một kanji không có mapping, log record đó để review; không để Gemini đoán âm Hán Việt.
- 🤖 **Enrich `meaningsVi` bằng Gemini/Google Gen AI:** dịch `meanings` (EN) sang nghĩa tiếng Việt cho cả cụm từ, có context từ `term`, `reading`, `partOfSpeech`, ví dụ nếu có.
  - *Ví dụ:* `勉強` → EN: `Study` → VI: `Học tập`.
  - ❌ **Không** ghép nghĩa từng chữ (勉=cố gắng + 強=mạnh ≠ `Học tập`).
- ✅ **Trạng thái implementation:** KanjiDictVN + Gemini enrich là extension tiếp theo trên foundation hiện có trong `scripts/import-vocab.ts`.

### 💾 Giai đoạn 3 — PERSIST (Lưu trữ)

- 📝 Dùng `prisma.vocabularyEntry.upsert()` theo `[sourceName, sourceRecordId]` để chạy lại idempotent.
- 🎮 Sinh `AcceptedAnswer` records cho gameplay từ reading đã normalize.
- 🏷️ Đánh `sourceName`, `sourceRecordId`, `importVersion`, `normalizedAt` để tracking lineage.
- 🛡️ **Validate:** mọi entry phải có `jlptLevel`, ít nhất 1 reading, ít nhất 1 `meaningsVi`, và lineage fields hợp lệ.

---

## 🧩 Ví dụ cụ thể: Từ "図書館"

```text
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ STEP 1: Jisho API                                        │
│   Input:  searchForPhrase("図書館")                         │
│   Output: term=図書館, reading=としょかん, jlpt=N5, en=Library│
├─────────────────────────────────────────────────────────────┤
│ 2️⃣ STEP 2a: KanjiDictVN lookup                              │
│   図 → ĐỒ                                                  │
│   書 → THƯ                                                  │
│   館 → QUÁN                                                 │
│   amHanViet = ["Đồ Thư Quán"]                              │
├─────────────────────────────────────────────────────────────┤
│ 3️⃣ STEP 2b: Gemini / Google Gen AI                          │
│   Input:  term=図書館, reading=としょかん, en=Library         │
│   Output: meaningsVi = ["Thư viện"]                         │
├─────────────────────────────────────────────────────────────┤
│ 4️⃣ STEP 3: Prisma Upsert → VocabularyEntry                  │
│   term: 図書館                                              │
│   reading: としょかん                                        │
│   jlptLevel: N5                                             │
│   meaningsVi: ["Thư viện"]                                  │
│   amHanViet: ["Đồ Thư Quán"]                               │
│   sourceName: JISHO_API                                     │
│   + AcceptedAnswer { normalizedValue: "としょかん" }          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc file trong repo

```text
scripts/
├── data/
│   ├── vocab-n3-expanded.json        # 📝 Seed terms hiện có cho batch N3
│   ├── .import-progress.json         # ⏱️ Checkpoint/resume cho import dài
│   └── kanji-vn-source.json          # 🈴 Planned: file tĩnh từ KanjiDictVN
├── import-vocab.ts                   # 🚀 Pipeline foundation cho VocabularyEntry
└── seed-kanji.ts                     # ⚠️ Script seed kanji cũ, giữ riêng khỏi Goi pipeline
```

---

## 📋 Enum nguồn dữ liệu đã có trong schema

```prisma
enum ContentSourceName {
  INTERNAL_SEED   // 🚧 Dữ liệu hardcoded cũ
  JISHO_API       // 📖 Dữ liệu từ Jisho import pipeline
  KANJI_DICT_VN   // 🈴 Dữ liệu từ KanjiDictVN
}
```

> ⚠️ Nếu cần tracking riêng output AI trong tương lai, thêm source/metadata bằng migration riêng; không tự ý biến Gemini thành nguồn authority cho `amHanViet`.

---

## 🎯 Mục tiêu coverage Sprint 1

| Level | VocabularyEntry (ước tính) |
|:---:|:---|
| 🟢 N5 | ~800 |
| 🟡 N4 | ~1,500 |
| 🏆 **Tổng Sprint 1** | **~2,300** |

*Các level N3, N2, N1 sẽ được bổ sung dần ở các sprint sau khi pipeline đã ổn định.*

---

## 🛠️ Lưu ý khi implement

1. ⏱️ **Rate limiting Jisho:** Thêm delay 500ms–1s giữa mỗi request. Với 2.300 từ, script có thể mất ~20–40 phút.
2. 🤖 **Gemini/Google Gen AI chạy batch/offline:** Kiểm tra quota, retry transient errors, và bắt output JSON schema trước khi persist.
3. 🈴 **KanjiDictVN là deterministic source cho `amHanViet`:** lookup từng kanji; nếu thiếu mapping thì log để review, không hallucinate.
4. 🔄 **Idempotent:** Script phải dùng `upsert` để có thể chạy lại nhiều lần mà không tạo duplicate.
5. 💾 **Error recovery:** Lưu progress vào file (ví dụ: `scripts/data/.import-progress.json`) để resume nếu script bị crash giữa chừng.
6. 🧹 **Reading normalization:** Jisho có thể trả về reading có dấu chấm như `た.べる`; strip dấu chấm thành `たべる` trước khi lưu vào `AcceptedAnswer`.
7. 🛡️ **Validation:** Reject hoặc skip entry nếu thiếu `jlptLevel`, không có reading, không có `meaningsVi`, hoặc output AI fail schema.
8. 🚫 **Never runtime external API:** Gameplay, library, results và mọi route runtime chỉ đọc dữ liệu đã được materialize trong PostgreSQL.

---

## 🔗 Liên kết tài liệu

- 📄 [ADR-0001: Internal normalized content store](docs/adr/0001-internal-normalized-content-store.md)
- 🗺️ [PROJECT_ROADMAP_4_SPRINTS.md](PROJECT_ROADMAP_4_SPRINTS.md) — Xem mục "Data source strategy"
- 🗄️ [Prisma Schema](prisma/schema.prisma) — Model: `VocabularyEntry`, `AcceptedAnswer`
- 📚 [unofficial-jisho-api README](../unofficial-jisho-api/README.md) — API reference cho Jisho wrapper
