"use client";

import * as React from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form
      method="POST"
      action="/api/auth/login"
      className="flex w-full flex-col gap-5"
    >
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
        className="
          h-10
          w-full
          gap-2
          bg-blue-600
          text-white
          hover:bg-blue-700
        "
      >
        Sign in
      </Button>
    </form>
  );
}
