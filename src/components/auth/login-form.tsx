"use client";

import * as React from "react";
import { useActionState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { login, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            autoFocus
            className="h-10 pl-9 focus-visible:border-blue-600 focus-visible:ring-blue-600/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="h-10 pl-9 pr-9 focus-visible:border-blue-600 focus-visible:ring-blue-600/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p
          role="alert"
          className={cn(
            "flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600",
            "dark:bg-red-950/40 dark:text-red-400",
          )}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        className="h-10 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
        disabled={pending}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
