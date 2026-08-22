"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export default function GameSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [timePerKanji, setTimePerKanji] = useState(15);
  const [selectedJlpt, setSelectedJlpt] = useState<JlptLevel>("N5");
  const [isPrivate, setIsPrivate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateGame() {
    if (!isAuthenticated || !session?.user?.id) {
      router.push("/sign-in?callbackUrl=/game/setup");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your display name");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/game/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jlptLevel: selectedJlpt,
          timePerPromptSeconds: timePerKanji,
          isPrivate,
          maxRounds: 10,
          hostDisplayName: displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create room");

      const createdSessionId = data.id || data.sessionId;
      const createdParticipantId = data.hostParticipantId || data.participantId;

      // Store identity in sessionStorage for use in game page
      if (createdParticipantId) sessionStorage.setItem("participantId", createdParticipantId);
      if (createdSessionId) sessionStorage.setItem("sessionId", createdSessionId);

      router.push(`/game?session=${createdSessionId}&participant=${createdParticipantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGame() {
    if (!isAuthenticated || !session?.user?.id) {
      router.push("/sign-in?callbackUrl=/game/setup");
      return;
    }

    if (!joinDisplayName.trim()) {
      setError("Please enter your display name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter the room code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/game/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode.trim().toUpperCase(),
          displayName: joinDisplayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join room");

      // We need sessionId — fetch it via the room code lookup
      const sessionRes = await fetch(`/api/game/rooms/${roomCode.trim().toUpperCase()}`);
      const sessionData = await sessionRes.json();

      const createdPid = data.id || data.participantId;
      if (createdPid) sessionStorage.setItem("participantId", createdPid);
      if (sessionData.id) sessionStorage.setItem("sessionId", sessionData.id);

      router.push(`/game?session=${sessionData.id}&participant=${createdPid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasteCode() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRoomCode(text.trim().slice(0, 6).toUpperCase());
      }
    } catch (err) {
      console.error("Failed to read clipboard", err);
    }
  }

  return (
    <main className="flex-grow min-h-[calc(100vh-65px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Side: Conceptual Anchor (Vertically Centered) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-8">
          <h1 className="font-[family-name:var(--font-headline)] text-[3.5rem] font-bold leading-none text-[var(--color-primary)] tracking-tight">
            遊
          </h1>
          <div>
            <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)] mb-2">
              Configure Session
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[var(--color-secondary)] text-sm leading-relaxed max-w-md tracking-[0.02em]">
              Establish the parameters of your study environment or enter an
              existing session to commence practice.
            </p>
          </div>
          <div className="mt-8 border-t border-[var(--color-outline-variant)] pt-4 flex gap-4 opacity-50">
            <div className="w-8 h-8 bg-[var(--color-surface-container-highest)]"></div>
            <div className="w-8 h-8 bg-[var(--color-surface-container-high)]"></div>
            <div className="w-8 h-8 bg-[var(--color-surface-container)]"></div>
          </div>
        </div>

        {/* Right Side: Interaction Area (Exact Equal Height for both tabs) */}
        <div className="lg:col-span-7 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-8 md:p-12 h-[600px] flex flex-col justify-between shadow-sm">
          <div className="flex flex-col flex-1">
            {/* Tab Navigation */}
            <div className="flex mb-8 border-b border-[var(--color-outline-variant)] shrink-0">
              {(["create", "join"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError(null); }}
                  className={cn(
                    "font-[family-name:var(--font-label)] text-xs uppercase tracking-widest pb-3 px-6 -mb-[1px] transition-none",
                    activeTab === tab
                      ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                      : "text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]",
                  )}
                >
                  {tab === "create" ? "Create Game" : "Join Game"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm shrink-0">
                {error}
              </div>
            )}

            {/* Tab 1: Create Game */}
            {activeTab === "create" && (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col space-y-2">
                  <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                    Participant Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="font-[family-name:var(--font-body)] text-base text-[var(--color-primary)] placeholder:text-[var(--color-outline)]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)] block">
                    JLPT Level
                  </label>
                  <div className="grid grid-cols-5 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                    {(["N5", "N4", "N3", "N2", "N1"] as JlptLevel[]).map((level) => (
                      <label
                        key={level}
                        className="cursor-pointer border-r border-[var(--color-outline-variant)] py-2.5 text-center transition-none last:border-r-0 hover:bg-[var(--color-surface-container)]"
                      >
                        <input
                          type="radio"
                          name="jlpt"
                          value={level}
                          checked={selectedJlpt === level}
                          onChange={(e) => setSelectedJlpt(e.target.value as JlptLevel)}
                          className="sr-only peer"
                        />
                        <span className="font-[family-name:var(--font-body)] text-sm uppercase text-[var(--color-secondary)] peer-checked:font-bold peer-checked:text-[var(--color-primary)]">
                          {level.toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                    <span>Time per Kanji</span>
                    <span className="font-bold text-[var(--color-primary)]">{timePerKanji}s</span>
                  </label>
                  <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                    <button
                      onClick={() => setTimePerKanji((prev) => Math.max(5, prev - 5))}
                      className="flex h-9 w-9 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <div className="flex-grow text-center font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]">
                      {timePerKanji} Seconds
                    </div>
                    <button
                      onClick={() => setTimePerKanji((prev) => Math.min(60, prev + 5))}
                      className="flex h-9 w-9 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center border-b border-[var(--color-outline-variant)] py-2">
                  <Checkbox
                    id="private-game"
                    className="mr-4"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <label
                    htmlFor="private-game"
                    className="cursor-pointer select-none font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]"
                  >
                    Private Game
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: Join Game (Redesigned with Segmented Code Input) */}
            {activeTab === "join" && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Display Name Field */}
                  <div className="flex flex-col space-y-2">
                    <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                      Participant Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your display name"
                      value={joinDisplayName}
                      onChange={(e) => setJoinDisplayName(e.target.value)}
                      className="font-[family-name:var(--font-body)] text-base text-[var(--color-primary)] placeholder:text-[var(--color-outline)]"
                    />
                  </div>

                  {/* Segmented Room Code Field */}
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                        6-Digit Room Code
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteCode}
                        className="inline-flex items-center gap-1 font-[family-name:var(--font-label)] text-[11px] font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_paste</span>
                        Paste Code
                      </button>
                    </div>

                    {/* Segmented Visual Boxes */}
                    <div className="relative">
                      {/* Hidden text input covering the boxes */}
                      <input
                        type="text"
                        autoFocus
                        maxLength={6}
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer text-center uppercase"
                      />

                      {/* Visual 6 Cells */}
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, index) => {
                          const char = roomCode[index] || "";
                          const isCurrent = roomCode.length === index;

                          return (
                            <div
                              key={index}
                              className={cn(
                                "flex h-14 items-center justify-center border bg-[var(--color-surface-container-lowest)] font-[family-name:var(--font-headline)] text-2xl font-bold transition-all",
                                isCurrent
                                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                                  : char
                                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                    : "border-[var(--color-outline-variant)] text-[var(--color-outline)]"
                              )}
                            >
                              {char || <span className="opacity-20">—</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--color-secondary)] text-center">
                      Click boxes or type to enter the alphanumeric code
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button at bottom */}
          <div className="pt-6 shrink-0">
            {activeTab === "create" ? (
              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
                onClick={handleCreateGame}
                disabled={loading}
              >
                {loading ? "Creating..." : "Start game"}
                {!loading && (
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                    arrow_forward
                  </span>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
                onClick={handleJoinGame}
                disabled={loading || roomCode.length < 6}
              >
                {loading ? "Joining..." : "Join game"}
                {!loading && (
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                    login
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
