---
name: technical-explainer
description: Standardized engineering framework for explaining bug fixes, refactoring, and feature implementations focused on direct code analysis, before/after code diffs, root causes, and architectural mechanics without relying on ASCII/Mermaid diagrams.
---

# Technical Explainer Skill (Code-First Engineering Standard)

Whenever fixing a bug, refactoring, or implementing a feature, explain the solution deeply and rigorously through **direct code analysis** for software engineers. Focus on real code diffs, line-by-line logic changes, and technical trade-offs rather than abstract diagrams.

---

## 📋 Mandatory Code-Centric Explanation Structure

### 🔍 1. Bản chất vấn đề & Root Cause (Root Cause Analysis)
- Trình bày ngắn gọn, chính xác lỗi kỹ thuật ở cấp độ hệ thống/code (Data mutation, Stale closure, N+1 Query, Race condition, Type mismatch, Missing DTO field,...).
- Chỉ rõ chính xác file và hàm/phương thức phát sinh lỗi.

---

### 💻 2. Phân tích chi tiết Code Thay Đổi (Code Diff & Walkthrough)
Trình bày rõ ràng các đoạn code thực tế đã thay đổi theo định dạng **Before vs After**:

#### 🔴 Code Cũ (Vấn đề / Flaw):
```java // hoặc tsx, ts
// Trích dẫn đoạn code cũ và chỉ rõ tại sao nó gây ra lỗi
```

#### 🟢 Code Mới (Giải pháp / Fix):
```java // hoặc tsx, ts
// Trích dẫn đoạn code mới đã tối ưu
```

- **Line-by-line Breakdown:** Giải thích từng dòng code quan trọng vừa thêm/sửa:
  - Thuật toán / Pattern được áp dụng là gì?
  - Xử lý edge cases (null, undefined, concurrency, concurrency guards) ra sao?

---

### ⚙️ 3. Cơ chế hoạt động kỹ thuật (Technical Mechanism)
- Phân tích cách dữ liệu di chuyển qua các hàm/lớp đã sửa:
  - **Backend (Spring Boot / JPA / SQL):** Cách Hibernate/JPA biên dịch thành câu lệnh SQL, cơ chế Transaction boundary, in-memory caching/mapping $O(1)$.
  - **Frontend (Next.js / React 19):** React lifecycle, state reconciliation, optimistic updates, payload handling.

---

### 📊 4. Tóm tắt tác động kỹ thuật (Technical Impact Summary)
Tóm tắt ngắn gọn các thông số kỹ thuật:
- **Files Modified:** Danh sách file kèm link clickable.
- **Time/Space Complexity:** Độ phức tạp thuật toán trước vs sau (ví dụ: $O(N) \to O(1)$).
- **Data Integrity / UX Impact:** Đảm bảo dữ liệu không bị sai lệch, không bị lag giao diện.
