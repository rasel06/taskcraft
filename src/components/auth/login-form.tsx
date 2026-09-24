"use client";

import * as React from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LOGIN_ERRORS } from "@/lib/login-errors";

// Submits to /api/auth/login with fetch so failures show inline. The plain
// method/action attributes keep it working without JavaScript (the route then
// redirects back with ?error=, passed in as `initialError`).
export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(initialError ?? null);
  const [pending, setPending] = React.useState(false);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      const data: { redirectTo?: string; error?: string } = await res.json().catch(() => ({}));

      if (res.ok && data.redirectTo) {
        // Full navigation so the app loads with the new session cookie.
        window.location.assign(data.redirectTo);
        return;
      }

      setError(data.error ?? LOGIN_ERRORS.server_error);
      if (res.status === 401 && passwordRef.current) {
        passwordRef.current.value = "";
        passwordRef.current.focus();
      }
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
    }
    setPending(false);
  }

  return (
    <form
      method="POST"
      action="/api/auth/login"
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="flex w-full flex-col gap-5"
    >
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>

        <div className="relative">
          <Mail
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            autoFocus
            aria-invalid={!!error || undefined}
            onChange={() => error && setError(null)}
            className="
              h-10
              pl-9
              focus-visible:border-blue-600
              focus-visible:ring-blue-600/30
            "
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>

        <div className="relative">
          <Lock
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            ref={passwordRef}
            aria-invalid={!!error || undefined}
            onChange={() => error && setError(null)}
            className="
              h-10
              pl-9
              pr-9
              focus-visible:border-blue-600
              focus-visible:ring-blue-600/30
            "
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-muted-foreground
              hover:text-foreground
            "
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="
          h-10
          w-full
          gap-2
          bg-blue-600
          text-white
          hover:bg-blue-700
        "
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
