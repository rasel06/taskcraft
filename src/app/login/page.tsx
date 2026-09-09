import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">
          T
        </div>
        <span className="text-lg font-semibold text-foreground">TaskCraft</span>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-border p-6">
        <h1 className="mb-6 text-sm font-semibold text-foreground">Sign in to your workspace</h1>
        <LoginForm />
      </div>
      <p className="max-w-sm text-center text-xs text-faint-foreground">
        Demo accounts: alice@taskcraft.dev / bob@taskcraft.dev / carol@taskcraft.dev / dave@taskcraft.dev — password{" "}
        <span className="font-mono">password123</span>
      </p>
    </div>
  );
}
