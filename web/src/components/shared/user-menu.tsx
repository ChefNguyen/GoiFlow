"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

type UserMenuProps = {
  avatarUrl?: string | null;
  avatarInitial: string;
  displayName: string;
  email?: string | null;
};

export function UserMenu({
  avatarUrl,
  avatarInitial,
  displayName,
  email,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleMenu}
        className="flex items-center gap-2 border border-transparent hover:border-[var(--color-primary)] px-2 py-1 bg-transparent transition-all duration-[50ms] text-[var(--color-primary)] cursor-pointer select-none h-10"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-none object-cover border border-[var(--color-primary)] shrink-0"
          />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--color-primary)] bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-on-primary)] rounded-none">
            {avatarInitial}
          </div>
        )}
        <span className="hidden sm:inline font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider">
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-100 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-primary)] rounded-none shadow-2xl z-50 animate-[fadeIn_0.15s_ease-out] focus:outline-none">
          {/* User Info Header */}
          <div className="px-4 py-3 flex flex-col select-none border-b border-[var(--color-outline-variant)]">
            <span className="font-[family-name:var(--font-headline)] text-sm font-bold text-[var(--color-primary)] truncate">
              {displayName}
            </span>
            {email && (
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--color-secondary)] truncate mt-0.5">
                {email}
              </span>
            )}
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-wider text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors duration-[50ms]"
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-label)] text-xs font-medium uppercase tracking-wider text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors duration-[50ms]"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-outline-variant)]" />

          {/* Sign Out Action */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-[50ms] cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
