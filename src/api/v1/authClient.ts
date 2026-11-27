/**
 * SYNTRA Authentication API Client — v1.
 *
 * Handles HTTP requests for signup, OTP verification, login, guest access,
 * and user session management.
 *
 * When VITE_API_BASE_URL is configured, all calls hit the remote backend.
 * When not configured (development/preview mode), it runs a deterministic,
 * safe local mock provider so the complete user flow works out of the box.
 */
import {
  API_VERSION,
  type ApiErrorCode,
  type AuthUser,
  type SignUpRequestBody,
  type SignUpResponseBody,
  type VerifyOtpRequestBody,
  type VerifyOtpResponseBody,
  type ResendOtpRequestBody,
  type ResendOtpResponseBody,
  type LoginRequestBody,
  type LoginResponseBody,
  type AnonymousResponseBody,
  type MeResponseBody,
  type LogoutResponseBody,
  type EmailChangeRequestResponseBody,
  type EmailChangeVerifyResponseBody,
  type PasswordChangeResponseBody,
} from "./contract";
import { ApiRequestError, isRemoteApiConfigured, setAuthToken } from "./client";
import { sendWelcomeNotification } from "@/services/notifications";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const STORAGE_TOKEN_KEY = "syntra_auth_token";
const STORAGE_USER_KEY = "syntra_auth_user";
const MOCK_ACCOUNTS_KEY = "syntra_mock_accounts_v1";

/* --------------------------- Token Persistence --------------------------- */

let memoryToken: string | null = null;
let memoryUser: AuthUser | null = null;

export function getStoredToken(): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = window.localStorage.getItem(STORAGE_TOKEN_KEY);
      if (val !== null) return val;
    }
  } catch {
    // Local storage unavailable
  }
  return memoryToken;
}

export function getStoredUser(): AuthUser | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_USER_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // Local storage unavailable
  }
  return memoryUser;
}

export function saveSession(token: string | null, user: AuthUser | null): void {
  memoryToken = token;
  memoryUser = user;
  setAuthToken(token);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (token) {
        window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
      }

      if (user) {
        window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
  } catch {
    // Local storage unavailable (private browsing fallback)
  }
}

export function clearSession(): void {
  saveSession(null, null);
}

/* ----------------------------- Remote Transport ----------------------------- */

async function authRequest<T>(path: string, options: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/${API_VERSION}${path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "omit",
    mode: "cors",
  }).catch(() => {
    throw new ApiRequestError("dependency_unavailable", "Failed to reach authentication server.", true);
  });

  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try {
      payload = await response.json();
    } catch {
      // Ignored
    }
    const message = payload.message || `Authentication failed (${response.status})`;
    const code: ApiErrorCode =
      response.status === 401
        ? "unauthorized"
        : response.status === 403
          ? "forbidden"
          : response.status === 429
            ? "rate_limited"
            : response.status === 404
              ? "not_found"
              : response.status >= 400 && response.status < 500
                ? "invalid_input"
                : "internal_error";
    throw new ApiRequestError(code, message, response.status >= 500 || response.status === 429);
  }

  return (await response.json()) as T;
}

/* ------------------------- Local Mock State ------------------------- */

interface PendingVerification {
  email: string;
  code: string;
  passwordSalt?: string;
  passwordHash?: string;
  expiresAt: number;
}

const mockPendingVerifications = new Map<string, PendingVerification>();
interface MockAccount {
  user: AuthUser;
  passwordSalt?: string;
  passwordHash?: string;
}

interface PendingEmailChange {
  email: string;
  code: string;
  expiresAt: number;
}

const mockAccounts = new Map<string, MockAccount>();
const mockEmailChanges = new Map<string, PendingEmailChange>();

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "string" &&
    (candidate.email === null || typeof candidate.email === "string") &&
    (candidate.role === "analyst" || candidate.role === "admin" || candidate.role === "guest")
  );
}

function loadMockAccounts(): void {
  try {
    const raw = window.localStorage.getItem(MOCK_ACCOUNTS_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const value of parsed) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
      const account = value as Partial<MockAccount>;
      if (
        isAuthUser(account.user) &&
        typeof account.passwordSalt === "string" &&
        typeof account.passwordHash === "string"
      ) {
        mockAccounts.set(account.user.id, {
          user: account.user,
          passwordSalt: account.passwordSalt,
          passwordHash: account.passwordHash,
        });
      }
    }
  } catch {
    // Local storage may be unavailable or contain invalid demo data.
  }
}

function persistMockAccounts(): void {
  try {
    window.localStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify([...mockAccounts.values()]));
  } catch {
    // The local demo account remains available for this page session.
  }
}

loadMockAccounts();

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new ApiRequestError(
      "dependency_unavailable",
      "Secure local account changes require browser cryptography support.",
      false,
    );
  }
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const hash = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return encodeBase64(new Uint8Array(hash));
}

async function createPasswordCredentials(password: string): Promise<{ salt: string; hash: string }> {
  if (!globalThis.crypto?.getRandomValues) {
    throw new ApiRequestError(
      "dependency_unavailable",
      "Secure local account changes require browser cryptography support.",
      false,
    );
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return {
    salt: encodeBase64(salt),
    hash: await derivePasswordHash(password, salt),
  };
}

async function verifyMockPassword(account: MockAccount, password: string): Promise<boolean> {
  if (!account.passwordSalt || !account.passwordHash) return false;
  const actual = decodeBase64(
    await derivePasswordHash(password, decodeBase64(account.passwordSalt)),
  );
  const expected = decodeBase64(account.passwordHash);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

function generateMockCode(): string {
  // Always standard 6-digit code. In mock mode, we use "123456" for predictable testing
  return "123456";
}

/* ---------------------------- Public API Surface ---------------------------- */

/**
 * Step 1 of Signup: Register credentials and request email OTP verification code.
 */
export async function apiSignUp(body: SignUpRequestBody): Promise<SignUpResponseBody> {
  if (isRemoteApiConfigured()) {
    return authRequest<SignUpResponseBody>("/auth/signup", {
      method: "POST",
      body,
    });
  }

  // --- Local Fallback Mode ---
  const normalizedEmail = (body.email || body.phone || "").trim().toLowerCase();
  const demoCode = generateMockCode();
  const credentials = body.password
    ? await createPasswordCredentials(body.password)
    : undefined;
  mockPendingVerifications.set(normalizedEmail, {
    email: normalizedEmail,
    code: demoCode,
    passwordSalt: credentials?.salt,
    passwordHash: credentials?.hash,
    expiresAt: Date.now() + 600_000, // 10 minutes
  });

  // Trigger optional welcome notification webhook if configured
  void sendWelcomeNotification(normalizedEmail);

  if (import.meta.env.DEV) {
    console.info(`[Auth Mock] Signup initiated for ${normalizedEmail}. Verification OTP code: ${demoCode}`);
  }

  return {
    status: "pending_verification",
    message: `Verification code sent to ${normalizedEmail}`,
    email: body.email,
    phone: body.phone,
    otp_channel: body.otp_channel || "email",
    expires_in_seconds: 600,
    demo_code: demoCode,
  };
}

/**
 * Step 2 of Signup / Login: Verify the 6-digit OTP code to activate account or session.
 */
export async function apiVerifyOtp(body: VerifyOtpRequestBody): Promise<VerifyOtpResponseBody> {
  if (isRemoteApiConfigured()) {
    const res = await authRequest<VerifyOtpResponseBody>("/auth/verify-otp", {
      method: "POST",
      body,
    });
    saveSession(res.token, res.user);
    return res;
  }

  // --- Local Fallback Mode ---
  const normalizedEmail = (body.email || body.phone || "").trim().toLowerCase();
  const pending = mockPendingVerifications.get(normalizedEmail);

  if (!pending) {
    throw new ApiRequestError(
      "invalid_input",
      "No pending verification was found. Please start signup again.",
      false,
    );
  }
  if (pending.expiresAt <= Date.now()) {
    mockPendingVerifications.delete(normalizedEmail);
    throw new ApiRequestError(
      "invalid_input",
      "The verification code expired. Request a new code and try again.",
      false,
    );
  }
  if (pending.code !== body.code) {
    throw new ApiRequestError("invalid_input", "Invalid verification code. Please check your code and try again.", false);
  }

  mockPendingVerifications.delete(normalizedEmail);

  const user: AuthUser = {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: normalizedEmail,
    name: normalizedEmail.split("@")[0],
    role: "analyst",
    is_verified: true,
    created_at: new Date().toISOString(),
  };
  if (pending.passwordSalt && pending.passwordHash) {
    mockAccounts.set(user.id, {
      user,
      passwordSalt: pending.passwordSalt,
      passwordHash: pending.passwordHash,
    });
    persistMockAccounts();
  }
  const token = `syn_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;

  saveSession(token, user);

  return {
    status: "verified",
    message: "Identity verified successfully. Welcome to SYNTRA.",
    token,
    user,
    expires_in_seconds: 86400 * 7,
  };
}

/**
 * Resend OTP code if expired or lost.
 */
export async function apiResendOtp(body: ResendOtpRequestBody): Promise<ResendOtpResponseBody> {
  if (isRemoteApiConfigured()) {
    return authRequest<ResendOtpResponseBody>("/auth/resend-otp", {
      method: "POST",
      body,
    });
  }

  // --- Local Fallback Mode ---
  const normalizedEmail = (body.email || body.phone || "").trim().toLowerCase();
  const pending = mockPendingVerifications.get(normalizedEmail);
  if (!pending) {
    throw new ApiRequestError(
      "not_found",
      "No pending verification was found. Please start signup again.",
      false,
    );
  }

  const demoCode = generateMockCode();
  mockPendingVerifications.set(normalizedEmail, {
    ...pending,
    email: normalizedEmail,
    code: demoCode,
    expiresAt: Date.now() + 600_000,
  });

  if (import.meta.env.DEV) {
    console.info(`[Auth Mock] Resent OTP code to ${normalizedEmail}: ${demoCode}`);
  }

  return {
    status: "sent",
    message: `A fresh verification code was sent to ${normalizedEmail}`,
    email: body.email,
    phone: body.phone,
    expires_in_seconds: 600,
    demo_code: demoCode,
  };
}

/**
 * Standard password login.
 */
export async function apiLogin(body: LoginRequestBody): Promise<LoginResponseBody> {
  if (isRemoteApiConfigured()) {
    const res = await authRequest<LoginResponseBody>("/auth/login", {
      method: "POST",
      body,
    });
    saveSession(res.token, res.user);
    return res;
  }

  // --- Local Fallback Mode ---
  const normalizedEmail = (body.email || body.phone || "").trim().toLowerCase();
  const account = [...mockAccounts.values()].find(
    (candidate) => candidate.user.email?.toLowerCase() === normalizedEmail,
  );
  if (!account || !body.password || !(await verifyMockPassword(account, body.password))) {
    throw new ApiRequestError("unauthorized", "Invalid email or password.", false);
  }
  if (!account.user.is_verified) {
    throw new ApiRequestError("unauthorized", "This account has not been verified.", false);
  }
  const user = account.user;
  const token = `syn_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  saveSession(token, user);
  return {
    status: "authenticated",
    message: "Signed in successfully",
    token,
    user,
    expires_in_seconds: 86400 * 7,
  };

}

/**
 * Anonymous / Guest login for immediate access.
 */
export async function apiAnonymousLogin(): Promise<AnonymousResponseBody> {
  if (isRemoteApiConfigured()) {
    const res = await authRequest<AnonymousResponseBody>("/auth/anonymous", {
      method: "POST",
    });
    saveSession(res.token, res.user);
    return res;
  }

  // --- Local Fallback Mode ---
  const user: AuthUser = {
    id: `guest_${Math.random().toString(36).slice(2, 8)}`,
    email: null,
    name: "Guest Analyst",
    role: "guest",
    is_verified: true,
  };
  const token = `syn_guest_${Date.now()}`;

  saveSession(token, user);

  return {
    status: "authenticated",
    token,
    user,
    expires_in_seconds: 86400,
  };
}

/**
 * Retrieve current user profile using the stored Bearer token.
 */
export async function apiGetMe(): Promise<MeResponseBody> {
  if (isRemoteApiConfigured()) {
    return authRequest<MeResponseBody>("/auth/me", { method: "GET" });
  }

  // --- Local Fallback Mode ---
  const stored = getStoredUser();
  if (!stored) {
    throw new ApiRequestError("unauthorized", "No active session found.", false);
  }
  return { user: stored };
}

/**
 * End current session.
 */
export async function apiLogout(): Promise<LogoutResponseBody> {
  if (isRemoteApiConfigured()) {
    try {
      await authRequest<LogoutResponseBody>("/auth/logout", { method: "POST" });
    } catch {
      // Ignored
    }
  }

  clearSession();
  return { success: true, message: "Logged out successfully" };
}

export async function apiRequestEmailChange(
  newEmail: string,
  currentPassword: string,
): Promise<EmailChangeRequestResponseBody> {
  const cleanEmail = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
    throw new ApiRequestError("invalid_input", "Please enter a valid email address.", false);
  }
  if (isRemoteApiConfigured()) {
    return authRequest<EmailChangeRequestResponseBody>("/auth/change-email/request", {
      method: "POST",
      body: { new_email: cleanEmail, current_password: currentPassword || undefined },
    });
  }

  const user = getStoredUser();
  if (!user || user.role === "guest") {
    throw new ApiRequestError("forbidden", "Guest sessions cannot change account email.", false);
  }
  const account = mockAccounts.get(user.id);
  if (!account) {
    throw new ApiRequestError("not_found", "The local account could not be found.", false);
  }
  if (
    account.passwordHash &&
    (!currentPassword || !(await verifyMockPassword(account, currentPassword)))
  ) {
    throw new ApiRequestError("invalid_input", "The current password is incorrect.", false);
  }
  if (cleanEmail === user.email?.toLowerCase()) {
    throw new ApiRequestError("invalid_input", "The new email must differ from your current email.", false);
  }
  if (
    [...mockAccounts.values()].some(
      (candidate) =>
        candidate.user.id !== user.id &&
        candidate.user.email?.toLowerCase() === cleanEmail,
    )
  ) {
    throw new ApiRequestError("invalid_input", "An account with this email already exists.", false);
  }

  const code = generateMockCode();
  mockEmailChanges.set(user.id, {
    email: cleanEmail,
    code,
    expiresAt: Date.now() + 600_000,
  });
  return {
    status: "pending_verification",
    message: `Verification code sent to ${cleanEmail}`,
    email: cleanEmail,
    expires_in_seconds: 600,
    demo_code: code,
  };
}

export async function apiVerifyEmailChange(
  newEmail: string,
  code: string,
): Promise<EmailChangeVerifyResponseBody> {
  const cleanEmail = newEmail.trim().toLowerCase();
  if (isRemoteApiConfigured()) {
    const response = await authRequest<EmailChangeVerifyResponseBody>(
      "/auth/change-email/verify",
      { method: "POST", body: { new_email: cleanEmail, code } },
    );
    saveSession(response.token, response.user);
    return response;
  }

  const user = getStoredUser();
  if (!user || user.role === "guest") {
    throw new ApiRequestError("forbidden", "Guest sessions cannot change account email.", false);
  }
  const pending = mockEmailChanges.get(user.id);
  if (!pending || pending.email !== cleanEmail) {
    throw new ApiRequestError("not_found", "No pending email verification was found.", false);
  }
  if (pending.expiresAt <= Date.now()) {
    mockEmailChanges.delete(user.id);
    throw new ApiRequestError("invalid_input", "The verification code expired. Request a new one.", false);
  }
  if (pending.code !== code) {
    throw new ApiRequestError("invalid_input", "The verification code is incorrect.", false);
  }
  if (
    [...mockAccounts.values()].some(
      (candidate) =>
        candidate.user.id !== user.id &&
        candidate.user.email?.toLowerCase() === cleanEmail,
    )
  ) {
    throw new ApiRequestError("invalid_input", "An account with this email already exists.", false);
  }

  const token = getStoredToken();
  if (!token) {
    throw new ApiRequestError("unauthorized", "Sign in again before changing your email.", false);
  }
  const account = mockAccounts.get(user.id);
  if (!account) {
    throw new ApiRequestError("not_found", "The local account could not be found.", false);
  }
  const updatedUser = { ...account.user, email: cleanEmail, is_verified: true };
  account.user = updatedUser;
  mockAccounts.set(updatedUser.id, account);
  persistMockAccounts();
  mockEmailChanges.delete(user.id);
  saveSession(token, updatedUser);
  return {
    status: "verified",
    message: "Email address updated and verified.",
    token,
    user: updatedUser,
    expires_in_seconds: 86400 * 7,
  };
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<PasswordChangeResponseBody> {
  if (isRemoteApiConfigured()) {
    return authRequest<PasswordChangeResponseBody>("/auth/change-password", {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }

  const user = getStoredUser();
  if (!user || user.role === "guest") {
    throw new ApiRequestError("forbidden", "Guest sessions cannot change account passwords.", false);
  }
  const account = mockAccounts.get(user.id);
  if (!account) {
    throw new ApiRequestError("not_found", "The local account could not be found.", false);
  }
  if (!(await verifyMockPassword(account, currentPassword))) {
    throw new ApiRequestError("invalid_input", "The current password is incorrect.", false);
  }
  if (
    newPassword.length < 8 ||
    newPassword.length > 128 ||
    !/[a-z]/.test(newPassword) ||
    !/[A-Z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  ) {
    throw new ApiRequestError(
      "invalid_input",
      "The new password must be 8–128 characters and include an uppercase letter, a lowercase letter, and a number.",
      false,
    );
  }

  const credentials = await createPasswordCredentials(newPassword);
  account.passwordSalt = credentials.salt;
  account.passwordHash = credentials.hash;
  mockAccounts.set(user.id, account);
  persistMockAccounts();
  return { success: true, message: "Password changed successfully." };
}
