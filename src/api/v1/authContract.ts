/**
 * SYNTRA Backend Authentication Contract — v1.
 *
 * Defines the wire shapes for authentication, verification codes (OTP),
 * session tokens, and user profiles.
 */

export interface AuthUser {
  id: string;
  email: string | null;
  phone?: string | null;
  name?: string | null;
  role: "analyst" | "admin" | "guest";
  avatar_url?: string | null;
  created_at?: string;
  is_verified?: boolean;
}

/* ----------------------------- Signup ----------------------------- */

export interface SignUpRequestBody {
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  otp_channel?: "email" | "sms";
}

export interface SignUpResponseBody {
  status: "pending_verification" | "verified";
  message: string;
  email?: string;
  phone?: string;
  otp_channel?: "email" | "sms";
  expires_in_seconds: number;
  /** In development or mock environments, returned for convenience. */
  demo_code?: string;
}

/* --------------------------- Verify OTP --------------------------- */

export interface VerifyOtpRequestBody {
  email?: string;
  phone?: string;
  code: string;
  flow: "signup" | "login" | "reset";
}

export interface VerifyOtpResponseBody {
  status: "verified";
  message: string;
  token: string;
  refresh_token?: string;
  user: AuthUser;
  expires_in_seconds: number;
}

/* --------------------------- Resend OTP --------------------------- */

export interface ResendOtpRequestBody {
  email?: string;
  phone?: string;
  otp_channel?: "email" | "sms";
  flow: "signup" | "login" | "reset";
}

export interface ResendOtpResponseBody {
  status: "sent";
  message: string;
  email?: string;
  phone?: string;
  otp_channel?: "email" | "sms";
  expires_in_seconds: number;
  /** In development or mock environments, returned for convenience. */
  demo_code?: string;
}

/* ----------------------------- Login ------------------------------ */

export interface LoginRequestBody {
  email?: string;
  phone?: string;
  password?: string;
}

export interface LoginResponseBody {
  status: "authenticated";
  message: string;
  token: string;
  refresh_token?: string;
  user: AuthUser;
  expires_in_seconds: number;
}

/* ------------------------ Anonymous / Guest ----------------------- */

export interface AnonymousResponseBody {
  status: "authenticated";
  token: string;
  user: AuthUser;
  expires_in_seconds: number;
}

/* -------------------------- Current User -------------------------- */

export interface MeResponseBody {
  user: AuthUser;
}

/* ----------------------------- Logout ----------------------------- */

export interface LogoutResponseBody {
  success: boolean;
  message: string;
}

export interface EmailChangeRequestBody {
  new_email: string;
  current_password?: string;
}

export interface EmailChangeRequestResponseBody {
  status: "pending_verification";
  message: string;
  email: string;
  expires_in_seconds: number;
  demo_code?: string;
}

export interface EmailChangeVerifyRequestBody {
  new_email: string;
  code: string;
}

export interface EmailChangeVerifyResponseBody {
  status: "verified";
  message: string;
  token: string;
  refresh_token?: string;
  user: AuthUser;
  expires_in_seconds: number;
}

export interface PasswordChangeRequestBody {
  current_password: string;
  new_password: string;
}

export interface PasswordChangeResponseBody {
  success: boolean;
  message: string;
}
