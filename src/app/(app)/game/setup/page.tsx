"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GameSetupPage() {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [timePerKanji, setTimePerKanji] = useState(15);
  const [selectedJlpt, setSelectedJlpt] = useState("n5");
  const [showLobby, setShowLobby] = useState(false);

  return (
    <main className="flex-grow pt-32 pb-16 px-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      {/* Left Side: Conceptual Anchor (Asymmetry) */}
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

        {/* Aesthetic Graphic Element */}
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
          <button
            onClick={() => setActiveTab("create")}
            className={cn(
              "font-[family-name:var(--font-label)] text-xs uppercase tracking-widest pb-3 px-6 -mb-[1px] transition-none",
              activeTab === "create"
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]",
            )}
          >
            Create Game
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={cn(
              "font-[family-name:var(--font-label)] text-xs uppercase tracking-widest pb-3 px-6 -mb-[1px] transition-none",
              activeTab === "join"
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                : "text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)]",
            )}
          >
            Join Game
          </button>
        </div>

        {!showLobby && activeTab === "create" && (
          <div className="space-y-12">
            <div className="flex flex-col space-y-2">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                Participant Name
              </label>
              <Input
                type="text"
                placeholder="Enter your display name"
                className="font-[family-name:var(--font-body)] text-base text-[var(--color-primary)] placeholder:text-[var(--color-outline)]"
              />
            </div>

            <div className="space-y-4">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)] block">
                JLPT Level
              </label>
              <div className="grid grid-cols-5 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
                {["n5", "n4", "n3", "n2", "n1"].map((level) => (
                  <label
                    key={level}
                    className="cursor-pointer border-r border-[var(--color-outline-variant)] py-3 text-center transition-none last:border-r-0 hover:bg-[var(--color-surface-container)]"
                  >
                    <input
                      type="radio"
                      name="jlpt"
                      value={level}
                      checked={selectedJlpt === level}
                      onChange={(e) => setSelectedJlpt(e.target.value)}
                      className="sr-only peer"
                    />
                    <span className="font-[family-name:var(--font-body)] text-sm uppercase text-[var(--color-secondary)] peer-checked:font-bold peer-checked:text-[var(--color-primary)]">
                      {level}
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
              <Checkbox id="private-game" className="mr-4" />
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
                onClick={() => setShowLobby(true)}
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
              >
                Create Game
                <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                  arrow_forward
                </span>
              </Button>
            </div>
          </div>
        )}

        {!showLobby && activeTab === "join" && (
          <div className="space-y-12">
            <div className="flex flex-col space-y-2">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                Room Code
              </label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                className="font-[family-name:var(--font-headline)] text-2xl tracking-widest text-[var(--color-primary)] placeholder:text-[var(--color-outline)] text-center uppercase"
                maxLength={6}
              />
            </div>

            <div className="pt-8">
              <Button
                variant="primary"
                onClick={() => setShowLobby(true)}
                className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
              >
                Join Game
                <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                  login
                </span>
              </Button>
            </div>
          </div>
        )}

        {showLobby && (
          <div className="space-y-8">
            <div className="space-y-3 border-b border-[var(--color-outline-variant)] pb-6">
              <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Waiting room
              </p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-semibold text-[var(--color-primary)]">Room BK22</h3>
                  <p className="mt-2 text-sm text-[var(--color-secondary)]">
                    Waiting for players to confirm before the first kanji appears.
                  </p>
                </div>
                <div className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                  3 players ready
                </div>
              </div>
            </div>

            <div className="grid gap-px border border-[var(--color-outline-variant)] bg-[var(--color-outline-variant)]">
              {[
                { name: "Calligrapher", state: "Host", active: true },
                { name: "ZenMaster", state: "Ready" },
                { name: "KanaPulse", state: "Joining" },
              ].map((player) => (
                <div key={player.name} className={player.active ? "flex items-center justify-between bg-[var(--color-surface-container-highest)] p-4" : "flex items-center justify-between bg-[var(--color-surface-container-lowest)] p-4"}>
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-primary)]">{player.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-secondary)]">{player.state}</p>
                  </div>
                  <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => setShowLobby(false)} className="w-full py-4">
                Back to setup
              </Button>
              <Link href="/game" className="block">
                <Button variant="primary" className="w-full py-4">
                  Start session
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
