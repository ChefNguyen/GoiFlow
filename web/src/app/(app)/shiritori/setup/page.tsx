"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ShiritoriSetupPage() {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [timePerTurn, setTimePerTurn] = useState(15);
  const [botPlayers, setBotPlayers] = useState(2);

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-grow grid-cols-1 items-start gap-16 px-8 pb-16 pt-32 lg:grid-cols-12">
      <div className="sticky top-32 hidden h-full flex-col justify-center space-y-8 lg:col-span-5 lg:flex">
        <h1 className="font-[family-name:var(--font-headline)] text-[3.5rem] font-bold leading-none tracking-tight text-[var(--color-primary)]">
          し
        </h1>
        <div>
          <h2 className="mb-2 font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-primary)]">
            Configure Shiritori
          </h2>
          <p className="max-w-md font-[family-name:var(--font-body)] text-sm leading-relaxed tracking-[0.02em] text-[var(--color-secondary)]">
            Set up a new word-chain room with your preferred pace and bot roster, or enter an existing room to start playing.
          </p>
        </div>

        <div className="mt-12 flex gap-4 border-t border-[var(--color-outline-variant)] pt-4 opacity-50">
          <div className="h-8 w-8 bg-[var(--color-surface-container-highest)]"></div>
          <div className="h-8 w-8 bg-[var(--color-surface-container-high)]"></div>
          <div className="h-8 w-8 bg-[var(--color-surface-container)]"></div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-low)] p-8 md:p-12 lg:col-span-7">
        <div className="mb-12 flex border-b border-[var(--color-outline-variant)]">
          <button
            onClick={() => setActiveTab("create")}
            className={cn(
              "-mb-[1px] px-6 pb-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest transition-none",
              activeTab === "create"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                : "text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]",
            )}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={cn(
              "-mb-[1px] px-6 pb-3 font-[family-name:var(--font-label)] text-xs uppercase tracking-widest transition-none",
              activeTab === "join"
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                : "text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]",
            )}
          >
            Join Room
          </button>
        </div>

        {activeTab === "create" && (
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
              <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                <span>Bot players</span>
                <span className="font-bold text-[var(--color-primary)]">{botPlayers}</span>
              </label>
              <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                <button
                  onClick={() => setBotPlayers((prev) => Math.max(0, prev - 1))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex-grow text-center font-[family-name:var(--font-body)] text-base text-[var(--color-primary)]">
                  {botPlayers} Players
                </div>
                <button
                  onClick={() => setBotPlayers((prev) => Math.min(8, prev + 1))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex justify-between font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                <span>Time per turn</span>
                <span className="font-bold text-[var(--color-primary)]">{timePerTurn}s</span>
              </label>
              <div className="flex items-center gap-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2">
                <button
                  onClick={() => setTimePerTurn((prev) => Math.max(5, prev - 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex-grow text-center font-[family-name:var(--font-body)] text-base text-[var(--color-primary)]">
                  {timePerTurn} Seconds
                </div>
                <button
                  onClick={() => setTimePerTurn((prev) => Math.min(60, prev + 5))}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--color-outline)] text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <div className="flex items-center border-b border-[var(--color-outline-variant)] py-4">
              <Checkbox id="private-shiritori" className="mr-4" />
              <label
                htmlFor="private-shiritori"
                className="cursor-pointer select-none font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]"
              >
                Private Room
              </label>
            </div>

            <div className="pt-8">
              <Link href="/shiritori" className="block">
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
                >
                  Start shiritori
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                    arrow_forward
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "join" && (
          <div className="space-y-12">
            <div className="flex flex-col space-y-2">
              <label className="font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                Room Code
              </label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                className="text-center font-[family-name:var(--font-headline)] text-2xl uppercase tracking-widest text-[var(--color-primary)] placeholder:text-[var(--color-outline)]"
                maxLength={6}
              />
            </div>

            <div className="pt-8">
              <Link href="/shiritori" className="block">
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2 py-4 font-[family-name:var(--font-label)] text-sm uppercase tracking-widest"
                >
                  Join shiritori
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
                    login
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
