import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "Karan (Student)", email: "karan@unisphere.edu", password: "Student@123456" },
  { label: "Maya (Student)", email: "maya@stanford.edu", password: "Student@123456" },
  { label: "Admin", email: "admin@unisphere.edu", password: "Admin@123456" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    e.preventDefault();
    const em = overrideEmail ?? email;
    const pw = overridePass ?? password;
    if (!em.trim() || !pw) {
      toast.error("Please enter both your email and password.");
      return;
    }
    setBusy(true);
    try {
      const u = await login(em.trim(), pw);
      toast.success(`Welcome back, ${u.full_name.split(" ")[0]}!`);
      navigate(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Login failed. Please check your credentials."));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || newPassword.length < 8) {
      toast.error("Enter your email and a new password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/auth/reset-password", { email: email.trim(), new_password: newPassword });
      toast.success("Password reset. You can log in now.");
      setMode("login");
      setPassword(newPassword);
      setNewPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0713] px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 size-[480px] rounded-full bg-violet-600/18 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 size-[420px] rounded-full bg-amber-500/12 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" data-testid="login-brand-link" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 font-heading text-base font-black text-white">
            U
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Uni<span className="text-amber-400">sphere</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/[0.08] bg-[#16101F]/80 p-7 backdrop-blur-xl sm:p-8">
          <h1 data-testid="login-heading" className="font-heading text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "login"
              ? "Log in to reconnect with your campus network."
              : "Enter your email and choose a new password."}
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={mode === "login" ? handleLogin : handleReset}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoComplete="email"
              />
            </div>

            {mode === "login" ? (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="newpw">New password</Label>
                <Input
                  id="newpw"
                  data-testid="reset-new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
            )}

            <Button
              type="submit"
              data-testid={mode === "login" ? "login-submit-btn" : "reset-submit-btn"}
              disabled={busy}
              className="h-11 w-full text-sm font-semibold"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "login" ? "Log in" : "Reset password"}
            </Button>
          </form>

          <button
            type="button"
            data-testid="toggle-reset-mode-btn"
            onClick={() => setMode(mode === "login" ? "reset" : "login")}
            className="mt-4 block w-full text-center text-xs text-violet-400 transition-colors hover:text-violet-300"
          >
            {mode === "login" ? "Forgot your password?" : "Back to log in"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Quick demo access</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                data-testid={`demo-login-${a.label.split(" ")[0].toLowerCase()}`}
                disabled={busy}
                onClick={(e) => void handleLogin(e, a.email, a.password)}
                className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-left text-sm transition-colors duration-200 hover:border-violet-500/40 hover:bg-violet-500/[0.06] disabled:opacity-50"
              >
                <span className="font-medium text-slate-200">{a.label}</span>
                <ArrowRight className="size-3.5 text-violet-400" />
              </button>
            ))}
          </div>

          <p className="mt-7 text-center text-sm text-slate-400">
            New to Unisphere?{" "}
            <Link to="/signup" data-testid="login-to-signup-link" className="font-semibold text-violet-400 hover:text-violet-300">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
