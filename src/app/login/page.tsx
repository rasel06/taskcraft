import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

const HIGHLIGHTS = [
  "Plan sprints and roadmaps in one shared workspace",
  "Track issues from triage to done with full audit history",
  "Discuss, review, and ship without leaving the app",
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-12 py-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, white 0, transparent 35%), radial-gradient(circle at 85% 75%, white 0, transparent 30%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-700">
            T
          </div>
          <span className="text-lg font-semibold tracking-tight">TaskCraft</span>
        </div>

        <div className="relative flex flex-col gap-6">
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-balance">
            Project and issue management for modern teams
          </h1>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-blue-50">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-200">© 2026 TaskCraft. All rights reserved.</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-8 bg-background px-4 py-12 lg:w-1/2">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-bold text-white">
            T
          </div>
          <span className="text-lg font-semibold text-foreground">TaskCraft</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace to continue</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
