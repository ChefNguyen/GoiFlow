import { LibraryClient } from "./library-client";

export type LibraryEntry = {
  id: string;
  level: string;
  kanji: string;
  reading: string;
  amHanViet: string[];
  meaningsVi: string[];
  meaning: string;
};

export default async function LibraryPage(props: {
  searchParams?: Promise<{ levels?: string; search?: string; page?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const levels = searchParams?.levels !== undefined
    ? searchParams.levels.split(",").filter(Boolean)
    : ["N2"]; // Default to N2 as requested
  const search = searchParams?.search ?? "";
  const category = searchParams?.category ?? "Radicals";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  let initialEntries: LibraryEntry[] = [];
  let initialTotal = 0;
  let totalPages = 1;

  try {
    const params = new URLSearchParams();
    if (levels.length > 0) params.set("levels", levels.join(","));
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("limit", "8"); // Exactly 8 cards per page for a compact look

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${backendUrl}/library?${params.toString()}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const data = await res.json();
      initialEntries = (data.content || []).map((e: any) => ({
        id: e.id,
        level: e.jlptLevel,
        kanji: e.term,
        reading: e.reading || "",
        amHanViet: Array.isArray(e.amHanViet) ? e.amHanViet : [],
        meaningsVi: Array.isArray(e.meaningsVi) ? e.meaningsVi : [],
        meaning: Array.isArray(e.meaningsVi) && e.meaningsVi[0] ? e.meaningsVi[0] : "—",
      }));
      initialTotal = data.totalElements || 0;
      totalPages = Math.max(1, data.totalPages || 1);
    }
  } catch (err) {
    console.error("Failed to fetch library entries", err);
    initialEntries = [];
  }

  return (
    <LibraryClient
      initialEntries={initialEntries}
      initialTotal={initialTotal}
      initialPage={page}
      totalPages={totalPages}
      initialLevels={levels}
      initialSearch={search}
      initialCategory={category}
    />
  );
}
