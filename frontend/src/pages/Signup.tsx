import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getErrorMessage, COLLEGE_OPTIONS, DEGREE_OPTIONS, YEAR_OPTIONS,
  BRANCH_OPTIONS, SKILL_OPTIONS, INTEREST_OPTIONS,
} from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = ["Account", "Campus", "Skills & Interests"];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    college: COLLEGE_OPTIONS[0],
    degree: DEGREE_OPTIONS[0],
    branch: BRANCH_OPTIONS[0],
    current_year: YEAR_OPTIONS[1],
    grad_year: 2027,
    city_country: "",
    bio: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggle = (list: string[], setList: (l: string[]) => void, item: string) =>
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return "Please enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address.";
      if (form.password.length < 8) return "Your password must be at least 8 characters long.";
    }
    if (step === 1) {
      if (!form.city_country.trim()) return "Please enter your city and country.";
      if (form.grad_year < 2024 || form.grad_year > 2035) return "Graduation year must be between 2024 and 2035.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (skills.length === 0) {
      toast.error("Please select at least one skill so peers can find you.");
      return;
    }
    setBusy(true);
    try {
      const u = await signup({
        ...form,
        email: form.email.trim().toLowerCase(),
        grad_year: Number(form.grad_year),
        skills,
        interests,
      });
      toast.success(`Welcome to Unisphere, ${u.full_name.split(" ")[0]}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Sign up failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0713] px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-0 size-[480px] rounded-full bg-violet-600/18 blur-[130px]" />

      <div className="relative w-full max-w-lg">
        <Link to="/" data-testid="signup-brand-link" className="mb-7 flex items-center justify-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 font-heading text-base font-black text-white">
            U
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Uni<span className="text-amber-400">sphere</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/[0.08] bg-[#16101F]/80 p-7 backdrop-blur-xl sm:p-8">
          {/* Step indicator */}
          <div className="mb-7 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  data-testid={`signup-step-indicator-${i}`}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors duration-300",
                    i < step
                      ? "bg-emerald-500/20 text-emerald-400"
                      : i === step
                        ? "bg-violet-500 text-white"
                        : "bg-white/[0.06] text-slate-500",
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/[0.08]" />}
              </div>
            ))}
          </div>

          <h1 data-testid="signup-heading" className="font-heading text-2xl font-bold tracking-tight">
            {step === 0 && "Create your account"}
            {step === 1 && "Tell us about your campus"}
            {step === 2 && "What are you into?"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 0 && "Your gateway to students across hundreds of campuses."}
            {step === 1 && "This powers discovery so the right people find you."}
            {step === 2 && "Pick your skills and interests — you can refine these anytime."}
          </p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            {step === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Full name</Label>
                  <Input
                    id="fullname"
                    data-testid="signup-fullname-input"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="Karan Kumar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input
                    id="signup-email"
                    data-testid="signup-email-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    data-testid="signup-password-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label>College / University</Label>
                  <Select value={form.college} onValueChange={(v: string) => set("college", v)}>
                    <SelectTrigger data-testid="signup-college-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLEGE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Degree</Label>
                    <Select value={form.degree} onValueChange={(v: string) => set("degree", v)}>
                      <SelectTrigger data-testid="signup-degree-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREE_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current year</Label>
                    <Select value={form.current_year} onValueChange={(v: string) => set("current_year", v)}>
                      <SelectTrigger data-testid="signup-year-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Branch / Major</Label>
                  <Select value={form.branch} onValueChange={(v: string) => set("branch", v)}>
                    <SelectTrigger data-testid="signup-branch-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCH_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="gradyear">Graduation year</Label>
                    <Input
                      id="gradyear"
                      data-testid="signup-gradyear-input"
                      type="number"
                      value={form.grad_year}
                      onChange={(e) => set("grad_year", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City, Country</Label>
                    <Input
                      id="city"
                      data-testid="signup-city-input"
                      value={form.city_country}
                      onChange={(e) => set("city_country", e.target.value)}
                      placeholder="Punjab, India"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Short bio</Label>
                  <Textarea
                    id="bio"
                    data-testid="signup-bio-input"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Interested in AI/ML, computer vision and startups."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills <span className="text-slate-500">(pick at least one)</span></Label>
                  <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-white/[0.06] p-2.5">
                    {SKILL_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        data-testid={`signup-skill-${s.replace(/[^a-zA-Z]/g, "").toLowerCase()}`}
                        onClick={() => toggle(skills, setSkills, s)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors duration-200",
                          skills.includes(s)
                            ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                            : "border-white/[0.08] text-slate-400 hover:border-white/20",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-white/[0.06] p-2.5">
                    {INTEREST_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        data-testid={`signup-interest-${s.replace(/[^a-zA-Z]/g, "").toLowerCase()}`}
                        onClick={() => toggle(interests, setInterests, s)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors duration-200",
                          interests.includes(s)
                            ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                            : "border-white/[0.08] text-slate-400 hover:border-white/20",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="signup-back-btn"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-11"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" data-testid="signup-next-btn" onClick={next} className="h-11 flex-1 text-sm font-semibold">
                  Continue <ArrowRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button type="submit" data-testid="signup-submit-btn" disabled={busy} className="h-11 flex-1 text-sm font-semibold">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Join the Community"}
                </Button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already a member?{" "}
            <Link to="/login" data-testid="signup-to-login-link" className="font-semibold text-violet-400 hover:text-violet-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
