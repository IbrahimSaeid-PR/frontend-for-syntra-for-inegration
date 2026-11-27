import { useSyncExternalStore } from "react";
import type { AuthUser, SignUpRequestBody, VerifyOtpRequestBody, ResendOtpRequestBody, LoginRequestBody } from "@/api/v1/authContract";
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
  getStoredUser,
  getStoredToken,
  saveSession,
} from "@/api/v1/authClient";

export type { AuthUser };

interface AuthStoreState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

// Initialize session synchronously from persisted storage so page reload preserves auth
let currentState: AuthStoreState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
};

const listeners = new Set<() => void>();

function setState(next: Partial<AuthStoreState>): void {
  currentState = { ...currentState, ...next };
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): AuthStoreState {
  return currentState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  return {
    isLoading: state.isLoading,
    isAuthenticated: state.user !== null,
    user: state.user,
    token: state.token,
    updateProfileName: (name: string) => {
      if (!state.user) return;
      const user = { ...state.user, name };
      saveSession(state.token, user);
      setState({ user });
    },
    requestEmailChange: (email: string, currentPassword: string) =>
      apiRequestEmailChange(email, currentPassword),
    verifyEmailChange: async (email: string, code: string) => {
      setState({ isLoading: true });
      try {
        const response = await apiVerifyEmailChange(email, code);
        setState({ user: response.user, token: response.token });
        return response;
      } finally {
        setState({ isLoading: false });
      }
    },
    changePassword: (currentPassword: string, newPassword: string) =>
      apiChangePassword(currentPassword, newPassword),

    /**
     * Step 1: Sign up user with email & password, triggers 6-digit OTP dispatch.
     */
    signUp: async (credentials: SignUpRequestBody) => {
      setState({ isLoading: true });
      try {
        const response = await apiSignUp(credentials);
        return response;
      } finally {
        setState({ isLoading: false });
      }
    },

    /**
     * Step 2: Verify the 6-digit OTP code to complete registration or login.
     */
    verifyOtp: async (params: VerifyOtpRequestBody) => {
      setState({ isLoading: true });
      try {
        const response = await apiVerifyOtp(params);
        setState({ user: response.user, token: response.token });
        return response;
      } finally {
        setState({ isLoading: false });
      }
    },

    /**
     * Resend verification OTP code.
     */
    resendOtp: async (params: ResendOtpRequestBody) => {
      return apiResendOtp(params);
    },

    /**
     * Direct email + password login.
     */
    login: async (credentials: LoginRequestBody) => {
      setState({ isLoading: true });
      try {
        const response = await apiLogin(credentials);
        setState({ user: response.user, token: response.token });
        return response;
      } finally {
        setState({ isLoading: false });
      }
    },

    /**
     * Instant guest analyst access.
     */
    continueAsGuest: async () => {
      setState({ isLoading: true });
      try {
        const response = await apiAnonymousLogin();
        setState({ user: response.user, token: response.token });
        return response;
      } finally {
        setState({ isLoading: false });
      }
    },

    /**
     * Sign out and clear stored session.
     */
    signOut: async () => {
      setState({ isLoading: true });
      try {
        await apiLogout();
        setState({ user: null, token: null });
      } finally {
        setState({ isLoading: false });
      }
    },

    /**
     * Legacy adapter for backward compatibility.
     */
    signIn: async (provider?: string, params?: Record<string, unknown>) => {
      if (provider === "anonymous") {
        const res = await apiAnonymousLogin();
        setState({ user: res.user, token: res.token });
        return res.user;
      }

      if (params && typeof params.email === "string") {
        const res = await apiLogin({
          email: params.email,
          password: typeof params.password === "string" ? params.password : undefined,
        });
        setState({ user: res.user, token: res.token });
        return res.user;
      }

      const res = await apiAnonymousLogin();
      setState({ user: res.user, token: res.token });
      return res.user;
    },
  };
}
