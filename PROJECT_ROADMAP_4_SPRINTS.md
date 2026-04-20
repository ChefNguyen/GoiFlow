# GoiFlow — Roadmap 4 Sprint

> [!IMPORTANT]
> Tài liệu này là **bản kế hoạch 4 sprint tiếp theo** của dự án GoiFlow, được xây dựng dựa trên **trạng thái codebase hiện tại**, **các work items đã hoàn thành**, và **backlog còn lại**.

> [!TIP]
> Trọng tâm của roadmap là đưa GoiFlow từ trạng thái **foundation + prototype có UI** sang **product loop thật có data, persistence và test coverage**.

---

## 🎯 Snapshot hiện tại

### 🟢 Những gì đã khá vững

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Foundation Next.js App Router | ✅ Tốt | Cấu trúc route group đã rõ |
| Prisma + Auth.js | ✅ Tốt | Đã có wiring nền tảng |
| App shell / navigation | ✅ Tốt | Header, layout, điều hướng đã hình thành |
| Health / readiness routes | ✅ Tốt | Có nền tảng kiểm tra hệ thống |
| Verify pipeline | ✅ Tốt | Có lint, typecheck, db validate, test, build |
| Design mapping | ✅ Khá xa | Phần lớn screen chính đã có UI |

### 🟡 Những gì đã có UI nhưng chưa phải feature thật

| Surface | Trạng thái | Vấn đề còn thiếu |
|---|---|---|
| Kanji Game | 🟡 Partial | Có UI/flow cơ bản nhưng chưa server-backed |
| History | 🟡 Partial | Layout tốt nhưng vẫn dùng static data |
| Profile | 🟡 Partial | UI ổn nhưng chưa có progress thật |
| Library | 🟡 Partial | Card/filter đẹp nhưng chưa có data thật |
| Settings | 🟡 Partial | Chưa có persistence |
| Sign-in | 🟡 Partial | OAuth/dev auth có wiring, vài hành vi vẫn là placeholder |
| Shiritori | 🟡 Partial | Có UI concept nhưng chưa có backend flow |

### 🔴 Những gì còn thiếu để thành product thật

| Hạng mục | Mức độ thiếu | Ý nghĩa |
|---|---|---|
| Room/session lifecycle thật | 🔴 Chưa có | Chưa có nền gameplay thật |
| Create / Join room thật | 🔴 Chưa có | Chưa có entry flow đúng nghĩa |
| Submit answer / scoring / result | 🔴 Chưa có | Chưa có core game logic thật |
| Persisted history / profile | 🔴 Chưa có | Chưa có cảm giác tiến độ dài hạn |
| Real library data / filtering | 🔴 Chưa có | Library mới là UI catalog |
| Persisted settings | 🔴 Chưa có | Chưa có cá nhân hóa thật |
| Shiritori backend flow | 🔴 Chưa có | Chưa phải mode gameplay thật |
| E2E coverage cho core loop | 🔴 Còn mỏng | Chưa đủ tin cậy để scale |
| Docs / ADR / runbook cho domain | 🔴 Còn thiếu | Chưa chốt durable decisions |

---

## 🧭 Chiến lược ưu tiên

> [!WARNING]
> **Không mở rộng thêm nhiều surface trước khi hoàn thành một vertical slice thật.**

| Nguyên tắc | Nội dung |
|---|---|
| 1 | Hoàn thành **1 loop thật** trước khi mở rộng quá nhiều feature |
| 2 | Ưu tiên **Kanji Game** trước **Shiritori** |
| 3 | Chỉ nối **History / Profile** sau khi results được persist |
| 4 | Chỉ nối **Library / Settings** sau khi gameplay loop đầu tiên đã vững |
| 5 | Chỉ abstract/shared hóa khi pattern đã lặp thật sự |

### Mục tiêu roadmap

| Trạng thái hiện tại | Trạng thái mục tiêu |
|---|---|
| Foundation + clickable prototype | Product chơi được bằng data thật, có progress thật, có 2 mode đủ chắc để vào alpha nội bộ |

---

## 🗂️ Data source strategy cho toàn roadmap

> [!IMPORTANT]
> Vì main feature của GoiFlow là giúp user học **Goi** và **Kanji**, data strategy phải ưu tiên: **dataset lớn**, **phân loại JLPT rõ ràng**, **fetch/stream được theo cấp độ**, và **không phụ thuộc runtime vào third-party API không ổn định**.

> [!NOTE]
> **Quyết định mới được chốt:** external dataset/API chỉ là **nguồn dữ liệu thô upstream**. GoiFlow sẽ có **dataset nội bộ đã normalize**, trong đó schema nội bộ sẽ giàu hơn source gốc, bao gồm cả **nghĩa tiếng Việt** và **âm Hán Việt**.

### Chiến lược data source tổng thể

| Thành phần | Chiến lược chốt |
|---|---|
| Source of truth chính | **PostgreSQL qua Prisma** |
| Nguồn nội dung ban đầu | **Import một hoặc nhiều bộ dữ liệu JLPT Kanji + Vocabulary cỡ lớn vào DB nội bộ** |
| Vai trò của external API/source | **Chỉ là upstream raw input** để ingest/normalize, không phải runtime dependency chính |
| Kiểu truy cập dữ liệu | App chỉ gọi **API/server layer nội bộ** của GoiFlow, không fetch trực tiếp từ nguồn public ở client |
| Phân tầng nội dung | Mọi entry cần có trường **JLPT level** (`N5` → `N1`) để filter/query trực tiếp |
| Hình thức nạp dữ liệu | Dùng **import + normalize pipeline** theo batch để đưa dữ liệu vào DB |
| Hình thức phân phối tới UI | Dùng **server pagination / cursor / chunked fetch**; khi cần trải nghiệm liên tục thì dùng streaming ở tầng app/server, không stream thẳng từ nguồn ngoài |
| External enrich/sync | Có thể dùng để enrich/refresh dữ liệu, nhưng phải đi qua pipeline normalize trước khi phục vụ product |

### Cấu trúc dữ liệu nội dung nên có từ đầu

| Nhóm dữ liệu | Trường tối thiểu nên có |
|---|---|
| Kanji | `kanji`, `jlptLevel`, `meanings`, `meaningsVi`, `onyomi`, `kunyomi`, `amHanViet`, `strokes`, `radicals`, `examples` |
| Goi / Vocabulary | `term`, `reading`, `jlptLevel`, `meanings`, `meaningsVi`, `partOfSpeech`, `exampleSentence`, `sourceKanji`, `amHanViet` |
| Study metadata | `frequency`, `tags`, `isCommon`, `lessonGroup`, `sortKey` |
| Gameplay mapping | `promptType`, `acceptedAnswers`, `normalizedAnswers`, `difficultyWeight` |
| Import lineage | `sourceName`, `sourceRecordId`, `importVersion`, `normalizedAt` |

### Nguyên tắc thiết kế API data

| Nguyên tắc | Nội dung |
|---|---|
| JLPT-first | Mọi API query cho học tập/game nên filter được ngay theo `jlptLevel` |
| Internal-first serving | App chỉ serve từ dataset nội bộ đã normalize |
| Normalize before serve | Mọi dữ liệu external phải normalize sang schema GoiFlow trước khi dùng ở runtime |
| Chunked loading | Không tải toàn bộ dataset một lần; load theo level, page, hoặc cursor |
| Rich localized content | Nghĩa tiếng Việt và âm Hán Việt là field first-class trong schema nội bộ |
| Seed/import once, query many | Import dữ liệu vào DB, sau đó app chỉ query DB nội bộ |
| Stable runtime | Gameplay không phụ thuộc vào availability của public API bên ngoài |

### Định hướng normalize pipeline

| Bước | Mô tả |
|---|---|
| 1. Ingest | Kéo raw data từ external dataset/API/source files |
| 2. Map | Map field từ nguồn ngoài sang schema chuẩn nội bộ |
| 3. Enrich | Bổ sung `meaningsVi`, `amHanViet`, metadata học tập, tags, normalization fields |
| 4. Validate | Kiểm tra dữ liệu trùng, thiếu JLPT, thiếu reading, thiếu meaning |
| 5. Persist | Ghi vào PostgreSQL như source of truth nội bộ |
| 6. Serve | App query qua server/API nội bộ cho game, library, history, profile |

### Định hướng streaming/fetching

| Nhu cầu | Cách xử lý đề xuất |
|---|---|
| Dataset lớn | Load theo `JLPT + page/cursor` |
| Game feed liên tục | Server trả từng chunk round/content thay vì preload toàn bộ |
| Library dài | Infinite scroll hoặc pagination từ server |
| History/Profile | Query theo user/session, không stream full dataset |
| Content refresh | Chạy import/sync job riêng, không chặn runtime của app |

### Chiến lược data source theo từng sprint

| Sprint | Data strategy chốt |
|---|---|
| Sprint 1 | Dùng dataset nội bộ trong PostgreSQL cho **Kanji/Vocabulary N5 → N4**, đã normalize từ external source sang schema GoiFlow có `meaningsVi` và `amHanViet`, query theo `jlptLevel`, trả content theo chunk nhỏ cho gameplay |
| Sprint 2 | Dùng DB nội bộ làm source of truth cho results/history/profile; join ngược vào content tables nội bộ đã normalize để hiển thị chi tiết học tập |
| Sprint 3 | Mở rộng dataset nội bộ cho Library, hỗ trợ query/filter/search/pagination theo JLPT, metadata, nghĩa Việt, âm Hán Việt |
| Sprint 4 | Reuse content store nội bộ cho Shiritori, thêm normalization/rule data để validate word-chain trên cùng schema nội bộ |

### Quyết định chốt

> [!SUCCESS]
> **Chốt chiến lược:** GoiFlow sẽ dùng **PostgreSQL + Prisma làm content store chính**, với **bộ dữ liệu Goi/Kanji được ingest từ external source nhưng phải được normalize vào schema nội bộ của GoiFlow** trước khi phục vụ runtime. Schema nội bộ này sẽ giàu hơn source gốc, bao gồm **JLPT level**, **nghĩa tiếng Việt**, **âm Hán Việt**, và các field phục vụ gameplay/query.

### Data backlog cần bổ sung vào implementation

| Nhóm việc | Backlog cần làm |
|---|---|
| Schema | Thêm bảng/content models cho Kanji, Vocabulary, Example, metadata JLPT, nghĩa Việt, âm Hán Việt |
| Import pipeline | Viết script ingest + normalize + import dữ liệu lớn vào DB |
| Query layer | Thêm content repositories/services filter theo JLPT và localized fields |
| Normalization | Chuẩn hóa answers/readings/meanings/âm Hán Việt để gameplay xử lý ổn định |
| Runtime delivery | Thiết kế pagination/cursor/stream response phù hợp cho game và library |
| Lineage | Lưu thông tin source gốc và version import để quản lý dữ liệu |
| Docs | Ghi rõ data source decision vào docs/ADR khi bắt đầu implementation |

### ⚠️ Rủi ro cần tránh

| Rủi ro | Cách tránh |
|---|---|
| Runtime phụ thuộc public API | Không gọi external API trực tiếp từ gameplay flow |
| Dataset không đồng nhất | Chuẩn hóa schema import từ đầu |
| Filter JLPT không đáng tin | Bắt buộc `jlptLevel` là first-class field |
| Thiếu localized value | Coi `meaningsVi` và `amHanViet` là phần chính của internal schema |
| Library quá nặng | Luôn dùng pagination/cursor thay vì full fetch |
| Sau này khó reuse cho Shiritori | Chuẩn hóa content model sớm nhưng chỉ abstract vừa đủ |

---

# 🟦 Sprint 1 — Hoàn thành vertical slice thật đầu tiên cho Kanji Game

> [!NOTE]
> Đây là sprint quan trọng nhất vì nó biến GoiFlow từ prototype thành product loop thật đầu tiên.

## Mục tiêu sprint
- Biến **Kanji Game** thành feature đầu tiên có:
  - domain thật
  - server flow thật
  - persistence thật
  - test thật

## Bảng backlog Sprint 1

| Epic | Work item | Mức ưu tiên | Kết quả mong đợi |
|---|---|---|---|
| Domain model | Thêm model Prisma cho room/session/player/round/submission/result | P0 | Có data model thật cho vòng đời game |
| Domain model | Chốt rule guest user vs signed-in user gắn với session | P0 | Ownership rõ ràng |
| Server flow | Tạo repository/service cho create room | P0 | Setup không còn là `Link` tĩnh |
| Server flow | Tạo repository/service cho join room | P0 | User có thể vào room thật |
| Server flow | Tạo repository/service cho load round state | P0 | `/game` đọc được trạng thái thật |
| Server flow | Tạo repository/service cho submit answer | P0 | Có hành vi submit thật |
| Server flow | Tạo repository/service cho compute/fetch results | P0 | `/results` dùng data thật |
| Data source | Thêm content models nội bộ cho Kanji/Vocabulary theo JLPT | P0 | Có content store đủ để nuôi gameplay |
| Data source | Thêm field `meaningsVi` và `amHanViet` vào schema nội bộ | P0 | Dataset nội bộ phản ánh đúng nhu cầu sản phẩm |
| Data source | Viết script ingest/normalize/import dữ liệu N5 → N4 vào PostgreSQL | P0 | Có dataset khởi đầu đủ lớn và ổn định |
| Data source | Query round content theo `jlptLevel` và chunk nhỏ | P0 | Gameplay load được dữ liệu thật theo cấp độ |
| UI integration | Nối `src/app/(app)/game/setup/page.tsx` vào create/join room thật | P0 | Setup → Game chạy đúng |
| UI integration | Nối `src/app/(app)/game/page.tsx` vào flow submit thật | P0 | Submit xong lock đúng trạng thái |
| UI integration | Nối `src/app/(app)/results/page.tsx` vào result thật | P0 | Results không còn mock |
| Auth behavior | Giữ guest-accessible flow nhưng chốt rule attach kết quả | P0 | Không mâu thuẫn guest/auth |
| Testing | Viết integration test cho create/join/submit/results | P0 | Có coverage logic chính |
| Testing | Viết Playwright smoke cho `/game/setup` → `/game` → `/results` | P0 | Có e2e cho loop đầu tiên |
| Hardening | Sinh room code thật | P1 | UX thực tế hơn |
| Hardening | Validation cho join/submit payload | P1 | Giảm lỗi đầu vào |
| Hardening | Loading / error / empty state tối thiểu | P1 | Loop ổn định hơn |

## Ngoài phạm vi Sprint 1

| Không làm trong sprint này |
|---|
| History thật |
| Library thật |
| Settings persistence |
| Shiritori backend |
| Credentials auth hoàn chỉnh |

## Definition of Done

| Điều kiện | Mô tả |
|---|---|
| Guest gameplay thật | Guest có thể create/join game, submit answer, xem results thật |
| Verify pass | `npm run verify` pass |
| E2E tối thiểu | Có ít nhất 1 smoke test cho Kanji Game loop |
| Data đủ dùng | Có dataset nội bộ N5 → N4 đã normalize đủ để nuôi gameplay thực |

---

# 🟩 Sprint 2 — Biến kết quả game thành progress nhìn thấy được

> [!TIP]
> Sprint này tạo cảm giác “chơi có ý nghĩa”, vì kết quả bắt đầu sống lại trong profile và history.

## Mục tiêu sprint
- Làm cho kết quả game xuất hiện lại trong:
  - History
  - Profile
  - user progress surfaces

## Bảng backlog Sprint 2

| Epic | Work item | Mức ưu tiên | Kết quả mong đợi |
|---|---|---|---|
| History | Thay static data trong `src/app/(app)/history/page.tsx` bằng data thật | P0 | History thành feature thật |
| History | Load session history từ persistence | P0 | Có dữ liệu session thật |
| History | Nối detail pane với selected item thật | P0 | Detail pane có ý nghĩa thật |
| History | Nối filter thật nếu model hỗ trợ | P1 | History usable hơn |
| Profile | Thay static stats/recent sessions trong `src/app/(app)/(protected)/profile/page.tsx` | P0 | Profile phản ánh user thật |
| Profile | Tính và hiển thị stats như sessions/streak/accuracy | P0 | Progress có giá trị nhìn thấy được |
| Data source | Dùng results/submissions/session tables làm source of truth cho progress | P0 | Không cần external source cho progress |
| Data source | Join ngược vào content tables để render chi tiết term/kanji trong history | P0 | History/profile có ngữ cảnh học tập thật |
| Auth + persistence | Chốt rule guest results vs signed-in results | P0 | Persistence không mơ hồ |
| Auth + persistence | Chốt redirect / attach behavior sau sign-in nếu cần | P1 | Auth gắn với product loop tốt hơn |
| Testing | Viết integration test cho history/profile queries | P0 | Có coverage ở progress layer |
| Testing | Viết Playwright flow: signed-in user chơi game rồi thấy history/profile cập nhật | P0 | Chứng minh loop tiến độ hoạt động |
| Hardening | Tách service tính profile stats | P1 | Logic rõ hơn, dễ mở rộng hơn |

## Ngoài phạm vi Sprint 2

| Không làm trong sprint này |
|---|
| Library full productization |
| Shiritori backend đầy đủ |

## Definition of Done

| Điều kiện | Mô tả |
|---|---|
| History thật | Kết quả game xuất hiện lại trong History |
| Profile thật | Kết quả game phản ánh trong Profile |
| Auth boundary rõ | Guest-first flow vẫn không bị phá |
| Progress source rõ | Progress được tính hoàn toàn từ DB nội bộ |

---

# 🟨 Sprint 3 — Biến Library và Settings thành feature hữu ích thật

> [!NOTE]
> Sau gameplay và progress, sprint này tập trung vào **support loop**: nội dung học tập + cá nhân hóa trải nghiệm.

## Mục tiêu sprint
- Nâng **Library** và **Settings** từ UI surface lên feature thật có data và persistence.

## Bảng backlog Sprint 3

| Epic | Work item | Mức ưu tiên | Kết quả mong đợi |
|---|---|---|---|
| Library domain | Xác định source dữ liệu cho library | P0 | Có nền data thật |
| Library domain | Thêm repository/service cho filtering/pagination/sorting/category | P0 | Query layer rõ ràng |
| Library domain | Mở rộng dataset nội bộ lên coverage lớn hơn cho Goi/Kanji theo JLPT | P0 | Library đủ lớn để học lâu dài |
| Library domain | Thêm search fields / metadata như tags, frequency, lessonGroup | P1 | Filter/search mạnh hơn |
| Library domain | Mở rộng localized fields cho nghĩa Việt / âm Hán Việt ở library surface | P1 | Trải nghiệm học bám sát nhu cầu sản phẩm |
| Library UI | Thay static card data trong `src/app/(app)/library/page.tsx` | P0 | Library không còn là mock |
| Library UI | Hiển thị result count, entries, filter, pagination thật | P0 | Feature usable hơn |
| Library UX | Quyết định route/modal cho entry detail | P1 | Chuẩn bị mở rộng trải nghiệm học |
| Settings persistence | Persist settings trong `src/app/(app)/settings/page.tsx` | P0 | Settings save/load được thật |
| Settings behavior | Áp dụng ít nhất 1 setting vào gameplay thật | P0 | Settings có tác động thực |
| Testing | Integration tests cho library filtering/query | P0 | Có coverage data layer |
| Testing | Integration tests cho settings persistence | P0 | Có coverage persistence |
| Testing | Playwright smoke cho đổi setting rồi thấy effect còn giữ | P0 | Có kiểm chứng end-to-end |
| Nice-to-have | Search trong library | P1 | Support loop mạnh hơn |
| Nice-to-have | Saved / favorite items | P1 | Tăng retention/value |
| Nice-to-have | Link từ history/profile sang library detail | P1 | Tăng liên kết giữa surfaces |

## Ngoài phạm vi Sprint 3

| Không làm trong sprint này |
|---|
| Shiritori full parity nếu nguồn lực không đủ |

## Definition of Done

| Điều kiện | Mô tả |
|---|---|
| Library thật | Library dùng data thật và filter hoạt động |
| Settings thật | Settings được persist thật |
| Tác động thực | Ít nhất một setting ảnh hưởng đến trải nghiệm game |
| Dataset mở rộng | Library có coverage lớn hơn và query tốt theo JLPT |

---

# 🟥 Sprint 4 — Productize Shiritori và hardening toàn sản phẩm

> [!IMPORTANT]
> Sprint này đưa sản phẩm từ “một loop thật” sang “nhiều mode thật”, đồng thời chuẩn bị độ chín cho alpha nội bộ.

## Mục tiêu sprint
- Làm **Shiritori** thành game mode thật.
- Hardening toàn app về auth, quality, docs, và readiness.

## Bảng backlog Sprint 4

| Epic | Work item | Mức ưu tiên | Kết quả mong đợi |
|---|---|---|---|
| Shiritori backend | Nối `src/app/(app)/shiritori/setup/page.tsx` vào flow thật | P0 | Setup không còn là UI concept |
| Shiritori backend | Nối `src/app/(app)/shiritori/page.tsx` vào gameplay thật | P0 | Shiritori trở thành mode thật |
| Shiritori backend | Nối `src/app/(app)/leaderboard/page.tsx` vào result/leaderboard thật | P0 | Có loop hoàn chỉnh |
| Data source | Reuse cùng content store nội bộ cho Shiritori | P0 | Không cần data silo mới |
| Data source | Thêm normalized reading/term rules để validate word-chain | P0 | Validation chính xác hơn |
| Shared architecture | Reuse room/session/gameplay pattern từ Kanji Game | P0 | Không lặp lại kiến trúc vô ích |
| Shared architecture | Chỉ extract shared logic khi pattern đã ổn định | P1 | Tránh abstract sớm |
| Hardening | Rà soát protected vs guest-accessible surfaces | P0 | Boundary rõ ràng |
| Hardening | Rà soát redirect behavior và ownership assumptions | P0 | Auth ổn định hơn |
| Testing | Tăng e2e coverage cho cả 2 mode game | P0 | Product đáng tin cậy hơn |
| Docs | Cập nhật `docs/product/`, `docs/adr/`, `docs/runbooks/` | P0 | Durable decisions được ghi lại |
| UX debt | Fix các vấn đề ảnh hưởng usability/correctness/test stability | P1 | Alpha readiness tốt hơn |
| Nice-to-have | Better loading/empty/error states | P1 | Trải nghiệm tốt hơn |
| Nice-to-have | Share/export result flow | P1 | Giá trị mở rộng |

## Definition of Done

| Điều kiện | Mô tả |
|---|---|
| Shiritori thật | Shiritori có gameplay/data flow thật |
| Multi-mode ổn | Hai mode game dùng pattern rõ ràng, không rối |
| Alpha-ready baseline | Docs + tests + auth boundary đủ tốt cho alpha nội bộ |
| Shared content layer | Cùng một content store phục vụ được cả learning surfaces và game modes |

---

## 📦 Bản đồ backlog theo trạng thái

### ✅ Đã làm xong / gần như xong

| Hạng mục |
|---|
| Foundation setup: Next.js + Prisma + Auth.js + route groups |
| Base shell/navigation |
| Health/readiness endpoints |
| Verify pipeline |
| Design mapping cho phần lớn screen |
| Auth provider wiring + sign-in presentation baseline |

### 🟡 Đang ở mức partial

| Hạng mục |
|---|
| Kanji Game interactive UI |
| History visual mapping |
| Guest-accessible core flow |
| Profile / Settings / Library ở mức surface UI |

### 🔴 Chưa thành feature thật

| Hạng mục |
|---|
| Real room/session lifecycle |
| Real answer submission/scoring |
| Persisted history/profile progress |
| Real library data/filtering |
| Persisted settings |
| Shiritori backend flow |
| E2E coverage cho core loop |
| Durable docs/ADR cho domain decisions |
| Import + normalize pipeline cho dataset lớn Goi/Kanji |
| Content query layer theo JLPT + localized fields |

---

## 🧱 Thứ tự ưu tiên thực thi

| Thứ tự | Sprint | Lý do |
|---|---|---|
| 1 | **Sprint 1 — Kanji Game real loop** | Quan trọng nhất, mở khóa vertical slice thật đầu tiên |
| 2 | **Sprint 2 — History + Profile real progress** | Tạo cảm giác tiến độ và giá trị dài hạn |
| 3 | **Sprint 3 — Library + Settings real utility** | Bổ sung support loop và cá nhân hóa |
| 4 | **Sprint 4 — Shiritori + hardening** | Mở rộng mode thứ hai sau khi pattern đầu tiên đã vững |

---

## 🏁 Tiêu chí thành công của toàn roadmap

| Kết quả kỳ vọng | Ý nghĩa |
|---|---|
| 1 Kanji Game loop thật hoàn chỉnh | Product không còn chỉ là UI prototype |
| Progress thật xuất hiện lại trong app | User thấy được giá trị dài hạn |
| Library và Settings hữu ích thật | App có support loop đúng nghĩa |
| Shiritori trở thành mode thật | Sản phẩm có chiều sâu hơn |
| Automated coverage meaningful | Đủ tự tin để mở rộng tiếp |
| Docs/ADR/runbook đủ tốt | Team có thể scale tiếp mà không mơ hồ |
| Dataset JLPT lớn và ổn định | App đủ nội dung để phục vụ mục tiêu học Goi/Kanji lâu dài |
| Localized dataset đúng mục tiêu | Dataset nội bộ phản ánh được nghĩa Việt và âm Hán Việt mà external source không model đủ |

> [!SUCCESS]
> Khi hoàn thành 4 sprint này, GoiFlow sẽ thoát khỏi mức **prototype có UI đẹp** và bước sang mức **product baseline đủ chắc cho alpha nội bộ**, với **dataset nội bộ đã normalize đủ lớn để nuôi main feature học Goi/Kanji theo JLPT**.

---

## 🚀 Hành động nên làm ngay

### Ưu tiên bắt đầu từ Sprint 1

| Bước | Việc cần làm ngay |
|---|---|
| 1 | Chốt content schema + game schema trong Prisma |
| 2 | Chốt mapping normalize từ external source sang internal schema |
| 3 | Thêm field `meaningsVi` + `amHanViet` vào internal dataset design |
| 4 | Dựng script ingest / normalize / import cho dataset N5 → N4 |
| 5 | Dựng server flow create / join / submit / results |
| 6 | Query content theo `jlptLevel` và chunk nhỏ cho gameplay |
| 7 | Nối lại `/game/setup` → `/game` → `/results` bằng data thật |
| 8 | Thêm integration test + e2e smoke test |

### Những việc **không nên làm ngay lúc này**

| Không nên làm sớm |
|---|
| Mở rộng thêm nhiều screen mới |
| Làm Shiritori backend trước Kanji Game |
| Abstract shared architecture quá sớm |
| Dùng external API làm runtime dependency chính |
| Serve raw external data chưa normalize trực tiếp cho UI/game |
| Polish diện rộng khi loop chính chưa thật |
