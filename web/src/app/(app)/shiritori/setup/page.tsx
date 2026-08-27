"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ShiritoriSetupPage() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState(authSession?.user?.name || "");
  const [joinDisplayName, setJoinDisplayName] = useState(authSession?.user?.name || "");
  const [roomCode, setRoomCode] = useState("");
  const [timePerTurn, setTimePerTurn] = useState(15);
  const [botPlayers, setBotPlayers] = useState(2);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/game/shiritori/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || authSession?.user?.name || "Player",
          botPlayers,
          timePerTurn,
          isPrivate,
          userId: authSession?.user?.id,
          avatarUrl: authSession?.user?.image,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Shiritori room");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("participantId", data.participantId);
      }
      router.push(`/shiritori?session=${data.sessionId}&participant=${data.participantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || roomCode.trim().length < 6) {
      setError("Please enter a valid 6-character room code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/game/shiritori/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode.trim().toUpperCase(),
          displayName: joinDisplayName.trim() || authSession?.user?.name || "Player",
          userId: authSession?.user?.id,
          avatarUrl: authSession?.user?.image,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Room not found or could not join");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("participantId", data.participantId);
      }
      router.push(`/shiritori?session=${data.sessionId}&participant=${data.participantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRoomCode(text.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
      }
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-grow grid-cols-1 items-start gap-16 px-8 pb-16 pt-24 lg:grid-cols-12">
      <div className="sticky top-28 hidden h-full flex-col justify-center space-y-8 lg:col-span-5 lg:flex">
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-headline)] text-[3.5rem] font-bold leading-none tracking-tight text-[var(--color-primary)]">
            し
          </span>
          <span className="font-[family-name:var(--font-headline)] text-[2rem] font-bold text-[var(--color-secondary)]">
            りとり
          </span>
        </div>
        <div>
          <h2 className="mb-2 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
            Configure Shiritori
          </h2>
          <p className="max-w-md font-[family-name:var(--font-body)] text-sm leading-relaxed tracking-[0.02em] text-[var(--color-secondary)]">
            Set up a classic Japanese word-chain room. Chain vocabulary by the last syllable of the previous word. Beware of words ending in <strong className="text-[var(--color-primary)] font-bold">ん</strong>!
          </p>
        </div>

        <div className="mt-8 flex gap-4 border-t border-[var(--color-outline-variant)] pt-4 opacity-70">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
            <span className="inline-block w-2 h-2 bg-[var(--color-primary)]"></span>
            Word Chain Mode
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-8 md:p-12 lg:col-span-7 shadow-sm">
        <div className="mb-8 flex border-b border-[var(--color-outline-variant)]">
          <button
            onClick={() => { setActiveTab("create"); setError(null); }}
            className={cn(
              "-mb-[1px] px-6 pb-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest transition-none",
              activeTab === "create"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                : "text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]",
            )}
          >
            Create Room
          </button>
          <button
            onClick={() => { setActiveTab("join"); setError(null); }}
            className={cn(
              "-mb-[1px] px-6 pb-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest transition-none",
              activeTab === "join"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                : "text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]",
            )}
          >
            Join Room
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === "create" && (
          <div className="space-y-8">
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

            <div className="space-y-3">
              <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                <span>Bot opponents</span>
                <span className="font-bold text-[var(--color-primary)]">{botPlayers} {botPlayers === 1 ? "Bot" : "Bots"}</span>
              </label>
              <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                <button
                  type="button"
                  onClick={() => setBotPlayers((prev) => Math.max(0, prev - 1))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex-grow text-center font-[family-name:var(--font-body)] text-base text-[var(--color-primary)]">
                  {botPlayers === 0 ? "No Bots (Multiplayer Only)" : `${botPlayers} AI Opponents`}
                </div>
                <button
                  type="button"
                  onClick={() => setBotPlayers((prev) => Math.min(8, prev + 1))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                <span>Time per turn</span>
                <span className="font-bold text-[var(--color-primary)]">{timePerTurn}s</span>
              </label>
              <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                <button
                  type="button"
                  onClick={() => setTimePerTurn((prev) => Math.max(5, prev - 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex-grow text-center font-[family-name:var(--font-body)] text-base text-[var(--color-primary)]">
                  {timePerTurn} Seconds
                </div>
                <button
                  type="button"
                  onClick={() => setTimePerTurn((prev) => Math.min(60, prev + 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="flex items-center border-b border-[var(--color-outline-variant)] pb-4">
              <Checkbox
                id="private-shiritori"
                className="mr-3"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <label
                htmlFor="private-shiritori"
                className="cursor-pointer select-none font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]"
              >
                Private Room
              </label>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest !text-white"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? "Creating room..." : "Start shiritori"}
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
          <div className="space-y-8">
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
                <input
                  type="text"
                  autoFocus
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer text-center uppercase"
                />

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
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest !text-white"
                onClick={handleJoinRoom}
                disabled={loading || roomCode.length < 6}
              >
                {loading ? "Joining..." : "Join room"}
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
