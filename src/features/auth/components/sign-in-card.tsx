"use client";

import { useMemo, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface AuthProviderOption {
  id: string;
  label: string;
  type: "credentials" | "oauth";
}

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/game/setup";
  return value;
}

const providerConfig: Record<string, { icon: React.ReactNode; hoverBg: string }> = {
  google: {
    icon: (
      <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
      </svg>
    ),
    hoverBg: "hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)]",
  },
  facebook: {
    icon: (
      <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    hoverBg: "hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)]",
  }
};

const defaultIcon = (
  <span className="material-symbols-outlined text-[20px] mr-3" aria-hidden="true">
    login
  </span>
);

export function SignInCard({ providers }: { providers: AuthProviderOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );
  const credentialsProvider = providers.find((provider) => provider.type === "credentials");
  const oauthProviders = providers.filter((provider) => provider.type === "oauth");

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpResendSuccess, setOtpResendSuccess] = useState(false);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setOtpResendSuccess(false);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Gửi mã OTP thất bại. Vui lòng kiểm tra lại tài khoản.");
        return;
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi yêu cầu OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentialsProvider) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn(credentialsProvider.id, {
        email,
        otp,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Mã OTP không chính xác hoặc đã hết hạn.");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-grow items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="relative w-full max-w-[480px] bg-[var(--color-surface-container-lowest)] p-12">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-[var(--color-primary)]" />

        <header className="mb-12 text-center">
          <h1 className="mb-2 font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-primary)]">
            Login
          </h1>
          <p className="font-[family-name:var(--font-body)] text-sm uppercase tracking-[0.2em] text-[var(--color-secondary)]">
            語彙フロー
          </p>
        </header>

        {credentialsProvider ? (
          step === "credentials" ? (
            <form className="space-y-8" onSubmit={handleRequestOtp}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 pr-10 text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-primary)] transition-none hover:text-[var(--color-secondary)]"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between">
                <label htmlFor="remember-me" className="flex cursor-pointer items-center space-x-3">
                  <Checkbox id="remember-me" />
                  <span className="font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)]">Remember Me</span>
                </label>
                <Link
                  href="/sign-in"
                  className="font-[family-name:var(--font-body)] text-sm text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-sm tracking-widest !text-[var(--color-on-primary)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending OTP..." : "Get OTP Code"}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-8" onSubmit={handleVerifyOtp}>
              <div className="text-center text-[var(--color-primary)]">
                <p className="text-sm font-semibold mb-2">We sent a verification code to</p>
                <p className="text-base font-bold text-[var(--color-secondary)] mb-4">{email}</p>
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-xs underline text-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                >
                  Change Email/Password
                </button>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block font-[family-name:var(--font-label)] text-xs uppercase tracking-wider text-[var(--color-primary)]"
                >
                  Enter 6-digit OTP
                </label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="123456"
                  className="border-0 border-b-2 border-[var(--color-primary)] bg-transparent px-0 py-2 text-center text-2xl font-bold tracking-[8px] text-[var(--color-primary)] placeholder:text-[var(--color-secondary)] focus-visible:ring-0"
                  autoFocus
                />
              </div>

              {error && (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {otpResendSuccess && (
                <p className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Mã OTP mới đã được gửi thành công!
                </p>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-secondary)]">Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={async () => {
                    setOtpResendSuccess(false);
                    setError(null);
                    setIsSubmitting(true);
                    try {
                      const response = await fetch("/api/auth/request-otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password }),
                      });
                      const data = await response.json();
                      if (!response.ok) {
                        setError(data.error || "Gửi lại OTP thất bại.");
                        return;
                      }
                      setOtpResendSuccess(true);
                      setOtp("");
                    } catch (err) {
                      setError("Lỗi kết nối khi gửi lại OTP.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="underline text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-semibold"
                  disabled={isSubmitting}
                >
                  Resend Code
                </button>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-sm tracking-widest !text-[var(--color-on-primary)]"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? "Verifying..." : "Verify & Login"}
                </Button>
              </div>
            </form>
          )
        ) : (
          <p className="text-sm leading-6 text-[var(--color-secondary)]">
            Password sign-in is not available. Use an OAuth provider below.
          </p>
        )}

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
          <span className="mx-4 flex-shrink-0 font-[family-name:var(--font-body)] text-xs uppercase tracking-widest text-[var(--color-secondary)]">
            Or
          </span>
          <div className="flex-grow border-t border-[var(--color-outline-variant)]" />
        </div>

        <div className="space-y-4">
          {oauthProviders.length > 0 ? (
            oauthProviders.map((provider) => {
              const config = providerConfig[provider.id] || {
                icon: defaultIcon,
                hoverBg: "hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)]",
              };
              return (
                <button
                  key={provider.id}
                  className={`relative flex items-center justify-center w-full py-4 px-6 border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] font-[family-name:var(--font-body)] text-sm font-semibold tracking-wider rounded-none transition-all duration-75 active:scale-[0.98] cursor-pointer ${config.hoverBg}`}
                  onClick={() => signIn(provider.id, { callbackUrl })}
                >
                  {config.icon}
                  <span>Continue with {provider.label}</span>
                </button>
              );
            })
          ) : (
            <p className="text-sm leading-6 text-[var(--color-secondary)]">
              No OAuth provider is enabled yet. Add provider credentials to `.env`
              before using interactive OAuth sign-in.
            </p>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-secondary)]">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[var(--color-primary)] underline transition-none hover:text-[var(--color-secondary)]">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
