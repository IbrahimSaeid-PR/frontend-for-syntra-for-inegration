import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { SyntraLogo } from "@/components/Logo";
import { validateInternalRoute } from "@/security/urlValidation";
import {
  validateEmailCredential,
  validatePasswordCredential,
  validateStrictEmail,
  validatePhone,
  CREDENTIAL_ERRORS,
} from "@/security/credentialsValidation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  RotateCw,
  Smartphone,
  UserPlus,
  UserX,
} from "@/lib/icons";
import { Suspense, useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { useNavigate, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/investigate") {
  if (returnTo !== null && validateInternalRoute(returnTo).ok) {
    return returnTo;
  }
  return fallback;
}

type AuthMode = "signIn" | "signUp" | "verifyOtp";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const {
    isLoading: authLoading,
    isAuthenticated,
    signUp,
    verifyOtp,
    resendOtp,
    login,
    continueAsGuest,
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const [mode, setMode] = useState<AuthMode>("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP Verification state
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [activeChannel, setActiveChannel] = useState<"email" | "sms">("email");
  const [otpCode, setOtpCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const timerRef = useRef<number | null>(null);

  // Sign up channel preference (email or sms)
  const [otpChannel, setOtpChannel] = useState<"email" | "sms">("email");
  const [signUpPhone, setSignUpPhone] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (mode === "verifyOtp" && resendTimer > 0) {
      timerRef.current = window.setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, resendTimer]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    if (next !== "verifyOtp") {
      setOtpCode("");
    }
  };

  /* ----------------------- Submit Password Sign In / Up ----------------------- */

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const emailRaw = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (typeof password !== "string" || password.length === 0) {
      setError(CREDENTIAL_ERRORS.empty);
      return;
    }

    if (mode === "signUp") {
      // 1. Account sign-up requires valid email
      const emailCheck = validateStrictEmail(emailRaw);
      if (!emailCheck.valid) {
        setError(CREDENTIAL_ERRORS[emailCheck.error ?? "email"]);
        return;
      }
      const cleanEmail = emailCheck.value as string;

      // 2. Validate passwords match and complexity
      if (password !== confirmPassword) {
        setError(CREDENTIAL_ERRORS.mismatch);
        return;
      }
      const pwCheck = validatePasswordCredential(password);
      if (!pwCheck.valid) {
        setError(CREDENTIAL_ERRORS[pwCheck.error ?? "weak"]);
        return;
      }

      // 3. If SMS channel chosen, validate phone number
      let cleanPhone: string | undefined = undefined;
      if (otpChannel === "sms") {
        const phoneCheck = validatePhone(signUpPhone);
        if (!phoneCheck.valid) {
          setError(CREDENTIAL_ERRORS[phoneCheck.error ?? "phone"]);
          return;
        }
        cleanPhone = phoneCheck.value;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await signUp({
          email: cleanEmail,
          phone: cleanPhone,
          password,
          otp_channel: otpChannel,
        });

        setPendingEmail(cleanEmail);
        setPendingPhone(cleanPhone || "");
        setActiveChannel(otpChannel);
        setDemoCode(response.demo_code ?? null);
        setResendTimer(60);
        setMode("verifyOtp");

        toast.info("Verification code sent", {
          description:
            otpChannel === "sms"
              ? `A 6-digit code was sent via SMS to ${cleanPhone}`
              : `A 6-digit code was sent to ${cleanEmail}`,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Signup failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Sign In flow
    const emailCheck = validateEmailCredential(emailRaw);
    if (!emailCheck.valid) {
      setError(CREDENTIAL_ERRORS[emailCheck.error ?? "email"]);
      return;
    }
    const cleanCredential = emailCheck.value as string;

    setIsLoading(true);
    setError(null);

    try {
      const isPhone = !cleanCredential.includes("@");
      const payload = isPhone
        ? { phone: cleanCredential, password }
        : { email: cleanCredential, password };

      await login(payload);

      toast.success("Signed in", {
        description: "Welcome back — redirecting to your workspace.",
      });
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign-in could not be completed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------- Verify OTP Code --------------------------- */

  const executeVerifyOtp = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyOtp({
        email: pendingEmail,
        phone: pendingPhone || undefined,
        code: codeToVerify,
        flow: "signup" as const,
      });

      toast.success("Account created and verified", {
        description: "Welcome to SYNTRA — your investigation workspace is ready.",
      });
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code. Please check and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeVerifyOtp(otpCode);
  };

  /* ---------------------------- Resend OTP Code --------------------------- */

  const handleResendOtp = async (channelOverride?: "email" | "sms") => {
    if (resendTimer > 0 || isLoading) return;
    const targetChannel = channelOverride || activeChannel;

    if (targetChannel === "sms" && !pendingPhone) {
      setError("No phone number registered for SMS. Please edit registration or use email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await resendOtp({
        email: pendingEmail,
        phone: pendingPhone || undefined,
        otp_channel: targetChannel,
        flow: "signup" as const,
      });

      setActiveChannel(targetChannel);
      setResendTimer(60);
      if (response.demo_code) {
        setDemoCode(response.demo_code);
      }

      toast.success("New code sent", {
        description:
          targetChannel === "sms"
            ? `A fresh verification code was sent via SMS to ${pendingPhone}`
            : `A fresh verification code was sent to ${pendingEmail}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------- Guest ------------------------------- */

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await continueAsGuest();
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest access failed.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------- Render ------------------------------- */

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2">
            <SyntraLogo size={30} withSubtitle />
          </div>

          <div className="syn-card overflow-hidden border border-border/80 shadow-2xl backdrop-blur-md">
            {/* Header Text */}
            <div className="px-6 pb-3 pt-6 text-center">
              <h1 className="text-lg font-semibold text-foreground">
                {mode === "verifyOtp"
                  ? "Verify Your Account"
                  : mode === "signUp"
                    ? "Create SYNTRA Account"
                    : "Welcome to SYNTRA"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "verifyOtp"
                  ? activeChannel === "sms"
                    ? "Enter the 6-digit code sent via SMS to your mobile phone."
                    : "Enter the 6-digit code sent to your email inbox."
                  : mode === "signUp"
                    ? "Sign up with your email and choose where to receive your OTP."
                    : "Sign in to access your cybersecurity investigation workspace."}
              </p>
            </div>

            {/* Mode switcher tabs (only on signIn or signUp) */}
            {mode !== "verifyOtp" ? (
              <div
                className="mx-6 mb-4 grid grid-cols-2 gap-1 rounded-md border border-border bg-[var(--syntra-surface-soft)] p-1"
                role="tablist"
                aria-label="Authentication mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signIn"}
                  onClick={() => switchMode("signIn")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-sm px-2 py-2 text-xs font-semibold transition-colors",
                    mode === "signIn"
                      ? "bg-[var(--syntra-orange)] text-black shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LogIn className="size-3.5" />
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signUp"}
                  onClick={() => switchMode("signUp")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-sm px-2 py-2 text-xs font-semibold transition-colors",
                    mode === "signUp"
                      ? "bg-[var(--syntra-orange)] text-black shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <UserPlus className="size-3.5" />
                  Sign Up
                </button>
              </div>
            ) : null}

            {/* ======================= VERIFY OTP VIEW ======================= */}
            {mode === "verifyOtp" ? (
              <form onSubmit={handleOtpFormSubmit} className="flex flex-col gap-4 px-6 pb-6 pt-2">
                {/* Target account & delivery badge */}
                <div className="flex flex-col gap-2 rounded-md border border-border/70 bg-[var(--syntra-surface-soft)] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Account:</span>
                      <span className="truncate font-mono font-medium text-foreground">{pendingEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode("signUp")}
                      className="ml-2 shrink-0 text-[11px] font-semibold text-[var(--syntra-orange)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border/50 pt-2 text-[11px]">
                    {activeChannel === "sms" ? (
                      <>
                        <Smartphone className="size-3.5 shrink-0 text-[var(--syntra-orange)]" />
                        <span className="text-muted-foreground truncate">
                          SMS code sent to <strong className="font-mono text-foreground">{pendingPhone}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <Mail className="size-3.5 shrink-0 text-[var(--syntra-orange)]" />
                        <span className="text-muted-foreground truncate">
                          Email code sent to <strong className="font-mono text-foreground">{pendingEmail}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Six visible slots use one native, autofill-friendly input. */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="syn-otp-control relative flex gap-2" aria-label="Verification code">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span key={index} className="grid size-11 place-items-center rounded-md border border-border bg-[var(--syntra-surface-soft)] font-mono text-lg font-bold" aria-hidden="true">
                        {otpCode[index] ?? ""}
                      </span>
                    ))}
                    <input
                      value={otpCode}
                      onChange={(event) => {
                        const value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
                        setOtpCode(value);
                        if (value.length === 6) void executeVerifyOtp(value);
                      }}
                      disabled={isLoading}
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      aria-label="Six-digit verification code"
                      className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Demo Helper Badge (if applicable in dev/mock) */}
                {demoCode && (
                  <div className="rounded-md border border-[var(--syntra-orange)]/40 bg-[var(--syntra-orange)]/10 px-3 py-2 text-center text-[11px] text-[var(--syntra-orange)]">
                    <span className="font-semibold">Demo code: </span>
                    <code className="font-mono font-bold tracking-widest">{demoCode}</code>
                  </div>
                )}

                {/* Resend Timer & Link */}
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Didn't receive the code?</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-xs text-muted-foreground">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleResendOtp()}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-xs font-semibold text-[var(--syntra-orange)] hover:underline"
                      >
                        <RotateCw className="size-3" />
                        Resend code
                      </button>
                    )}
                  </div>

                  {/* Channel Switch Helper */}
                  <div className="flex items-center justify-end text-[11px]">
                    {activeChannel === "sms" ? (
                      <button
                        type="button"
                        onClick={() => void handleResendOtp("email")}
                        disabled={isLoading || resendTimer > 0}
                        className="text-[var(--syntra-orange)] hover:underline disabled:opacity-50"
                      >
                        Send to Email instead
                      </button>
                    ) : pendingPhone ? (
                      <button
                        type="button"
                        onClick={() => void handleResendOtp("sms")}
                        disabled={isLoading || resendTimer > 0}
                        className="text-[var(--syntra-orange)] hover:underline disabled:opacity-50"
                      >
                        Send via SMS instead
                      </button>
                    ) : null}
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-center text-xs text-[var(--syntra-danger)]">
                    {error}
                  </p>
                )}

                {/* Submit Verification */}
                <Button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="syn-btn-primary w-full"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Complete Registration
                      <CheckCircle2 className="size-4" />
                    </>
                  )}
                </Button>

                {/* Return to Sign in */}
                <button
                  type="button"
                  onClick={() => switchMode("signIn")}
                  className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Sign In
                </button>
              </form>
            ) : (
              /* ================= PASSWORD SIGN-IN / SIGN-UP FORM ================= */
              <form onSubmit={handlePasswordSubmit}>
                <div className="flex flex-col gap-3 px-6 pb-5">
                  {/* Email Input */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder={mode === "signUp" ? "Account Email (e.g. analyst@company.com)" : "Email Address (e.g. analyst@company.com)"}
                      type="email"
                      autoComplete={mode === "signUp" ? "email" : "username"}
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* OTP Channel Selector (Sign Up Only) */}
                  {mode === "signUp" && (
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-foreground">
                          Send 6-digit verification code via:
                        </label>
                        <span className="text-[10px] text-muted-foreground">Choose one</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOtpChannel("email")}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition-all",
                            otpChannel === "email"
                              ? "border-[var(--syntra-orange)] bg-[var(--syntra-orange)]/15 text-[var(--syntra-orange)] shadow-xs"
                              : "border-border bg-[var(--syntra-surface-soft)] text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Mail className="size-3.5" />
                          Email (Inbox)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpChannel("sms")}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition-all",
                            otpChannel === "sms"
                              ? "border-[var(--syntra-orange)] bg-[var(--syntra-orange)]/15 text-[var(--syntra-orange)] shadow-xs"
                              : "border-border bg-[var(--syntra-surface-soft)] text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Smartphone className="size-3.5" />
                          Phone (SMS)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phone Input (Sign Up with SMS Only) */}
                  {mode === "signUp" && otpChannel === "sms" && (
                    <div className="syn-fade-slide-in">
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          name="phone"
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="Mobile Phone (+20... or +1...)"
                          type="tel"
                          autoComplete="tel"
                          className="pl-9 font-mono"
                          disabled={isLoading}
                          required={otpChannel === "sms"}
                        />
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        Include your country code. Twilio will dispatch the 6-digit SMS code here.
                      </p>
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="password"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                      className="pl-9 pr-9"
                      disabled={isLoading}
                      required
                      minLength={mode === "signUp" ? 8 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Confirm Password Input (Sign Up Only) */}
                  {mode === "signUp" && (
                    <div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          className="pl-9 pr-9"
                          disabled={isLoading}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        Must be at least 8 characters with uppercase, lowercase, and numbers.
                      </p>
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="text-xs text-[var(--syntra-danger)]">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="syn-btn-primary w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : mode === "signUp" ? (
                      <>
                        Continue to verification
                        <ArrowRight className="size-4" />
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Guest Access (only when not in verifyOtp mode) */}
            {mode !== "verifyOtp" && (
              <div className="px-6 pb-5">
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[var(--syntra-surface)] px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleGuestLogin()}
                  disabled={isLoading}
                  className="w-full gap-2 border-border/80 hover:bg-[var(--syntra-surface-soft)]"
                >
                  <UserX className="size-4 text-muted-foreground" />
                  Continue as Guest Analyst
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border bg-[var(--syntra-surface-soft)] px-6 py-3 text-center text-[11px] text-muted-foreground">
              SYNTRA analyst access
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing you agree to use SYNTRA for defensive and educational
            cybersecurity analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
