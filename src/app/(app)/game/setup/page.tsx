"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export default function GameSetupPage() {
  const router = useRouter();
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

      // Store identity in sessionStorage for use in game page
      sessionStorage.setItem("participantId", data.hostParticipantId);
      sessionStorage.setItem("sessionId", data.sessionId);

      router.push(`/game?session=${data.sessionId}&participant=${data.hostParticipantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGame() {
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

      sessionStorage.setItem("participantId", data.participantId);
      sessionStorage.setItem("sessionId", sessionData.id);

      router.push(`/game?session=${sessionData.id}&participant=${data.participantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-grow pt-32 pb-16 px-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      {/* Left Side: Conceptual Anchor */}
      <div className="lg:col-span-5 hidden lg:flex flex-col justify-center h-full space-y-8 sticky top-32">
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
        <div className="mt-12 border-t border-[var(--color-outline-variant)] pt-4 flex gap-4 opacity-50">
          <div className="w-8 h-8 bg-[var(--color-surface-container-highest)]"></div>
          <div className="w-8 h-8 bg-[var(--color-surface-container-high)]"></div>
          <div className="w-8 h-8 bg-[var(--color-surface-container)]"></div>
        </div>
      </div>

      {/* Right Side: Interaction Area */}
      <div className="lg:col-span-7 bg-[var(--color-surface-container-low)] p-8 md:p-12">
        {/* Tab Navigation */}
        <div className="flex mb-12 border-b border-[var(--color-outline-variant)]">
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
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {activeTab === "create" && (
          <div className="space-y-12">
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

            <div className="space-y-4">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)] block">
                JLPT Level
              </label>
              <div className="grid grid-cols-5 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                {(["N5", "N4", "N3", "N2", "N1"] as JlptLevel[]).map((level) => (
                  <label
                    key={level}
                    className="cursor-pointer border-r border-[var(--color-outline-variant)] py-3 text-center transition-none last:border-r-0 hover:bg-[var(--color-surface-container)]"
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

            <div className="space-y-4">
              <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                <span>Time per Kanji</span>
                <span className="font-bold text-[var(--color-primary)]">{timePerKanji}s</span>
              </label>
              <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                <button
                  onClick={() => setTimePerKanji((prev) => Math.max(5, prev - 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex-grow text-center font-[family-name:var(--font-body)] text-base text-[var(--color-primary)]">
                  {timePerKanji} Seconds
                </div>
                <button
                  onClick={() => setTimePerKanji((prev) => Math.min(60, prev + 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="flex items-center border-b border-[var(--color-outline-variant)] py-4">
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

            <div className="pt-8">
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
            </div>
          </div>
        )}

        {activeTab === "join" && (
          <div className="space-y-12">
            <div className="flex flex-col space-y-2">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your display name"
                value={joinDisplayName}
                onChange={(e) => setJoinDisplayName(e.target.value)}
                className="font-[family-name:var(--font-body)] text-base text-[var(--color-primary)] placeholder:text-[var(--color-outline)]"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                Room Code
              </label>
              <Input
                type="text"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="font-[family-name:var(--font-headline)] text-2xl tracking-widest text-[var(--color-primary)] placeholder:text-[var(--color-outline)] text-center uppercase"
                maxLength={6}
              />
            </div>

            <div className="pt-8">
              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
                onClick={handleJoinGame}
                disabled={loading}
              >
                {loading ? "Joining..." : "Join game"}
                {!loading && (
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                    login
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
