import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  apiSignUp,
  apiVerifyOtp,
  apiResendOtp,
  apiLogin,
  apiAnonymousLogin,
  apiLogout,
  apiRequestEmailChange,
  apiVerifyEmailChange,
  apiChangePassword,
  getStoredToken,
  getStoredUser,
} from "@/api/v1/authClient";

describe("SYNTRA Authentication Flow (Mock & Contracts)", () => {
  beforeEach(async () => {
    await apiLogout();
  });

  it("initiates signup and dispatches pending OTP code", async () => {
    const email = `analyst_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const res = await apiSignUp({ email, password: "SecretPassword123" });

    expect(res.status).toBe("pending_verification");
    expect(res.email).toBe(email);
    expect(res.expires_in_seconds).toBe(600);
    expect(res.demo_code).toBeDefined();
    expect(res.demo_code?.length).toBe(6);
  });

  it("initiates signup with email identity and OTP via SMS phone channel", async () => {
    const email = `phone_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const phone = `+1202555${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await apiSignUp({
      email,
      phone,
      password: "SecretPassword123",
      otp_channel: "sms",
    });

    expect(res.status).toBe("pending_verification");
    expect(res.email).toBe(email);
    expect(res.phone).toBe(phone);
    expect(res.otp_channel).toBe("sms");
    expect(res.demo_code).toBeDefined();

    const verifyRes = await apiVerifyOtp({
      email,
      phone,
      code: res.demo_code ?? "123456",
      flow: "signup",
    });

    expect(verifyRes.status).toBe("verified");
    expect(verifyRes.user.email).toBe(email);
  });

  it("rejects invalid verification code during OTP verification", async () => {
    const email = `invalid_${Math.random().toString(36).slice(2)}@syntra.sec`;
    await apiSignUp({ email, password: "SecretPassword123" });

    await expect(
      apiVerifyOtp({ email, code: "000000", flow: "signup" }),
    ).rejects.toThrow();
  });

  it("does not accept the demo OTP without a pending signup", async () => {
    const email = `unregistered_${Math.random().toString(36).slice(2)}@syntra.sec`;

    await expect(
      apiVerifyOtp({ email, code: "123456", flow: "signup" }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("rejects an OTP after its ten-minute expiry", async () => {
    vi.useFakeTimers();
    try {
      const email = `expired_${Math.random().toString(36).slice(2)}@syntra.sec`;
      const signup = await apiSignUp({ email, password: "SecretPassword123" });
      vi.advanceTimersByTime(600_001);

      await expect(
        apiVerifyOtp({ email, code: signup.demo_code ?? "", flow: "signup" }),
      ).rejects.toThrow("expired");
    } finally {
      vi.useRealTimers();
    }
  });

  it("successfully verifies OTP code and activates session", async () => {
    const email = `verify_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const signupRes = await apiSignUp({ email, password: "SecretPassword123" });

    const verifyRes = await apiVerifyOtp({
      email,
      code: signupRes.demo_code ?? "123456",
      flow: "signup",
    });

    expect(verifyRes.status).toBe("verified");
    expect(verifyRes.token).toBeDefined();
    expect(verifyRes.user.email).toBe(email);
    expect(verifyRes.user.is_verified).toBe(true);

    // Verify persisted session in storage
    expect(getStoredToken()).toBe(verifyRes.token);
    expect(getStoredUser()?.email).toBe(email);
  });

  it("verifies email changes and changes passwords for a local account", async () => {
    const email = `account_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const newEmail = `updated_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const password = "CurrentPassword123";
    const newPassword = "UpdatedPassword456";
    const signup = await apiSignUp({ email, password });
    await apiVerifyOtp({ email, code: signup.demo_code ?? "", flow: "signup" });

    const emailChange = await apiRequestEmailChange(newEmail, password);
    await apiVerifyEmailChange(newEmail, emailChange.demo_code ?? "");
    expect(getStoredUser()?.email).toBe(newEmail);

    await expect(apiChangePassword("wrong-password", newPassword)).rejects.toThrow(
      "current password",
    );
    await apiChangePassword(password, newPassword);
    await apiLogout();

    const login = await apiLogin({ email: newEmail, password: newPassword });
    expect(login.user.email).toBe(newEmail);
    await expect(apiLogin({ email: newEmail, password })).rejects.toThrow();
  });

  it("handles OTP resend with fresh expiration", async () => {
    const email = `resend_${Math.random().toString(36).slice(2)}@syntra.sec`;
    await apiSignUp({ email, password: "SecretPassword123" });

    // Note: If hitting real backend, resend within cooldown is rate limited (cooldown test)
    try {
      const resendRes = await apiResendOtp({ email, flow: "signup" });
      expect(resendRes.status).toBe("sent");
      expect(resendRes.expires_in_seconds).toBe(600);
    } catch (err) {
      expect((err as Error).message).toMatch(/wait \d+ seconds/);
    }
  });

  it("allows password login for registered users", async () => {
    const email = `login_${Math.random().toString(36).slice(2)}@syntra.sec`;
    const signupRes = await apiSignUp({ email, password: "SecretPassword123" });
    await apiVerifyOtp({ email, code: signupRes.demo_code ?? "123456", flow: "signup" });

    const loginRes = await apiLogin({ email, password: "SecretPassword123" });

    expect(loginRes.status).toBe("authenticated");
    expect(loginRes.user.email).toBe(email);
    expect(getStoredToken()).toBe(loginRes.token);
  });

  it("supports anonymous guest analyst access", async () => {
    const guestRes = await apiAnonymousLogin();
    expect(guestRes.status).toBe("authenticated");
    expect(guestRes.user.role).toBe("guest");
    expect(guestRes.user.email).toBeNull();
  });

  it("clears credentials upon logout", async () => {
    await apiAnonymousLogin();
    expect(getStoredToken()).toBeTruthy();

    await apiLogout();
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
