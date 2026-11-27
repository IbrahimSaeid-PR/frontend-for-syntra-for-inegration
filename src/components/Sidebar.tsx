import {
  Archive,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Ellipsis,
  History,
  Info,
  LifeBuoy,
  LogOut,
  Menu,
  Pencil,
  Pin,
  PinOff,
  Radar,
  Settings,
  Share,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "@/lib/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  validateInvestigationTitle,
} from "@/security/inputValidation";
import {
  CREDENTIAL_ERRORS,
  validatePasswordCredential,
  validateStrictEmail,
} from "@/security/credentialsValidation";
import {
  readHistory,
  subscribeToConversationStore,
  renameThread,
  setThreadPinned,
  setThreadArchived,
  deleteThread,
  syncRemoteHistory,
} from "@/hooks/conversationStore";
import type { HistoryItem } from "@/types/investigation";
import { SyntraLogo, SyntraMark } from "./Logo";

export type SyntraView = "investigate" | "history" | "about";

interface SidebarProps {
  active: SyntraView;
  onNavigate: (view: SyntraView) => void;
  /** Mobile drawer visibility. */
  open: boolean;
  onClose: () => void;
  /** Restore a stored conversation by any of its turn ids (Recent click). */
  onRestoreInvestigation: (id: string) => void;
  /** Thread id of the conversation currently open in the workspace. */
  activeThreadId: string | null;
}

const STORAGE_KEY = "syntra.sidebar.collapsed";

/** How many recent investigation titles to show in the sidebar. */
const RECENT_LIMIT = 12;

/**
 * One row in the Recent list: title + actions menu. Conversations live for
 * the browser session; clicking a row restores it in the workspace.
 */
function RecentItem({
  item,
  active,
  onOpen,
}: {
  item: HistoryItem;
  active: boolean;
  onOpen: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const bounds = menuTriggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setMenuPosition({
      top: Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 196)),
      left: Math.max(8, Math.min(bounds.right + 4, window.innerWidth - 184)),
    });
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuTriggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const handleShare = () => {
    const url = `${window.location.origin}/investigate?id=${encodeURIComponent(item.threadId)}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        toast.success("Link copied", {
          description: "Anyone with this link can open the investigation in this session.",
        });
      })
      .catch(() => {
        toast.error("Copy failed", { description: "Clipboard access was denied." });
      });
  };

  const startRename = () => {
    setDraftTitle(item.question);
    setRenaming(true);
  };

  const commitRename = () => {
    const check = validateInvestigationTitle(draftTitle);
    if (!check.valid) {
      toast.error(check.error === "too_long" ? "Title is too long" : "Title is not valid", {
        description:
          check.error === "empty"
            ? "Enter a name for this conversation."
            : "Titles must be 120 characters or fewer with no control characters.",
      });
      return;
    }
    if (!check.valid || check.value === undefined) return;
    if (check.value !== item.question && renameThread(item.threadId, check.value)) {
      toast.success("Conversation renamed");
    }
    setRenaming(false);
  };

  const handleDelete = () => {
    setConfirmingDelete(false);
    if (deleteThread(item.threadId)) {
      toast.success("Conversation deleted");
      // If this conversation is open in the workspace, the Investigate page
      // listens for this and resets itself.
      window.dispatchEvent(
        new CustomEvent("syntra:thread-deleted", { detail: item.threadId }),
      );
    }
  };

  return (
    <div className="relative">
      <div
        className={cn("syn-recent-item group", active && "active", item.archived && "syn-recent-item-archived")}
        data-menu-open={menuOpen ? "true" : undefined}
        data-renaming={renaming ? "true" : undefined}
        aria-current={active ? "true" : undefined}
      >
        {renaming ? (
          <form
            className="flex min-w-0 flex-1 items-center"
            onSubmit={(event) => {
              event.preventDefault();
              commitRename();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRenaming(false);
            }}
          >
            <input
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              maxLength={120}
              aria-label="Conversation name"
              className="w-full rounded-sm border border-primary/50 bg-background px-1.5 py-1 text-xs text-foreground outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            title={item.question}
            onClick={() => onOpen(item.id)}
          >
            {item.pinned && <Pin className="size-3 shrink-0 fill-current text-primary" />}
            <span className="syn-recent-title">{item.question}</span>
            {item.archived && (
              <span className="syn-mono ml-auto shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                Archived
              </span>
            )}
          </button>
        )}
        <button
          ref={menuTriggerRef}
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Actions for ${item.question}`}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <Ellipsis className="size-3.5" />
        </button>
      </div>
      {menuOpen && createPortal(
        <div ref={menuRef} className="syn-recent-menu" role="menu" style={menuPosition}>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); handleShare(); }}><Share />Share</button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); startRename(); }}><Pencil />Rename</button>
          <hr />
          <button type="button" role="menuitem" onClick={() => { setThreadPinned(item.threadId, !item.pinned); setMenuOpen(false); toast.success(item.pinned ? "Unpinned" : "Pinned to top"); }}>
            {item.pinned ? <PinOff /> : <Pin />}{item.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          <button type="button" role="menuitem" onClick={() => { setThreadArchived(item.threadId, !item.archived); setMenuOpen(false); toast.success(item.archived ? "Conversation unarchived" : "Conversation archived"); }}>
            <Archive />{item.archived ? "Unarchive" : "Archive"}
          </button>
          <hr />
          <button type="button" role="menuitem" className="destructive" onClick={() => { setMenuOpen(false); setConfirmingDelete(true); }}><Trash2 />Delete</button>
        </div>,
        document.body,
      )}
      {confirmingDelete && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && setConfirmingDelete(false)}>
          <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby={`delete-title-${item.threadId}`}>
            <h2 id={`delete-title-${item.threadId}`} className="text-base font-semibold">Delete this conversation?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This permanently removes the conversation and all of its turns from this session. This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button type="button" className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90" onClick={handleDelete}>Delete</button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Inner nav used by both the desktop sidebar and the mobile drawer. */
function SidebarContent({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onNavigateAway,
  onRestoreInvestigation,
  activeThreadId,
}: {
  active: SyntraView;
  onNavigate: (view: SyntraView) => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigateAway: () => void;
  onRestoreInvestigation: (id: string) => void;
  activeThreadId: string | null;
}) {
  const navigate = useNavigate();
  const {
    signOut,
    user,
    updateProfileName,
    requestEmailChange,
    verifyEmailChange,
    changePassword,
  } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailDemoCode, setEmailDemoCode] = useState<string | null>(null);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [credentialsBusy, setCredentialsBusy] = useState(false);
  const sessionMenuRef = useRef<HTMLDetailsElement>(null);
  /** Display identity for the session flyout. */
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Guest analyst");
  const userMeta = user?.email || (user?.role === "guest" ? "Guest session · Local" : "Analyst workspace");
  const avatarInitials = (() => {
    if (!user) return "GA";
    if (user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return "GA";
  })();
  // In-memory store is synchronous, so state initializes from it directly;
  // the effect only subscribes to later changes.
  const [recent, setRecent] = useState<HistoryItem[] | null>(() => readHistory());

  useEffect(() => {
    void syncRemoteHistory();
    return subscribeToConversationStore(() => setRecent(readHistory()));
  }, []);

  const go = (view: SyntraView) => {
    onNavigate(view);
    onNavigateAway();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  const handleProfileSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profileName.trim();
    const hasControlCharacters = Array.from(name).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    });
    if (!name || name.length > 80 || hasControlCharacters) {
      setProfileNameError("Enter a display name of 1–80 characters without control characters.");
      return;
    }
    updateProfileName(name);
    setProfileNameError(null);
    setSettingsOpen(false);
    toast.success("Profile updated", {
      description: "Your display name is saved in this browser.",
    });
  };

  const handleEmailChangeRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const checkedEmail = validateStrictEmail(newEmail);
    if (!checkedEmail.valid || !checkedEmail.value) {
      setEmailChangeError(CREDENTIAL_ERRORS[checkedEmail.error ?? "email"]);
      return;
    }

    setCredentialsBusy(true);
    setEmailChangeError(null);
    try {
      const response = await requestEmailChange(checkedEmail.value, emailPassword);
      setPendingEmail(response.email);
      setEmailDemoCode(response.demo_code ?? null);
      setEmailCode("");
      toast.info("Verify your new email", {
        description: `A verification code was sent to ${response.email}.`,
      });
    } catch (error) {
      setEmailChangeError(
        error instanceof Error ? error.message : "Could not start email change.",
      );
    } finally {
      setCredentialsBusy(false);
    }
  };

  const handleEmailChangeVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingEmail || !/^\d{6}$/.test(emailCode)) {
      setEmailChangeError("Enter the 6-digit verification code.");
      return;
    }
    setCredentialsBusy(true);
    setEmailChangeError(null);
    try {
      await verifyEmailChange(pendingEmail, emailCode);
      setPendingEmail(null);
      setNewEmail("");
      setEmailPassword("");
      setEmailCode("");
      setEmailDemoCode(null);
      toast.success("Email address updated and verified.");
    } catch (error) {
      setEmailChangeError(
        error instanceof Error ? error.message : "Email verification failed.",
      );
    } finally {
      setCredentialsBusy(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const checkedPassword = validatePasswordCredential(newPassword);
    if (!checkedPassword.valid) {
      setPasswordChangeError(
        CREDENTIAL_ERRORS[checkedPassword.error ?? "weak"],
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError(CREDENTIAL_ERRORS.mismatch);
      return;
    }
    setCredentialsBusy(true);
    setPasswordChangeError(null);
    try {
      const response = await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(response.message);
    } catch (error) {
      setPasswordChangeError(
        error instanceof Error ? error.message : "Could not change password.",
      );
    } finally {
      setCredentialsBusy(false);
    }
  };

  return (
    <>
      {settingsOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSettingsOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-settings-title"
              className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl"
            >
              <header className="flex items-start gap-3 border-b border-border px-5 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <Settings className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="account-settings-title" className="text-base font-semibold">
                    Profile &amp; account
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Manage your SYNTRA profile and review your account details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Close settings"
                >
                  <X className="size-4" />
                </button>
              </header>

              <div className="max-h-[min(70vh,36rem)] space-y-5 overflow-y-auto p-5">
                <form onSubmit={handleProfileSave} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">Profile</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This name is shown in your SYNTRA session.
                    </p>
                  </div>
                  <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-profile-name">
                    Display name
                    <input
                      id="settings-profile-name"
                      autoFocus
                      autoComplete="name"
                      maxLength={80}
                      value={profileName}
                      onChange={(event) => {
                        setProfileName(event.target.value);
                        setProfileNameError(null);
                      }}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Your name"
                    />
                  </label>
                  {profileNameError && (
                    <p role="alert" className="text-xs text-destructive">
                      {profileNameError}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="syn-btn-primary rounded-md bg-[var(--syntra-orange)] px-3 py-2 text-xs font-semibold text-black"
                    >
                      Save profile
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Display name changes are stored in this browser.
                  </p>
                </form>

                <div className="space-y-5 border-t border-border pt-4">
                  {user?.role === "guest" ? (
                    <p className="rounded-lg border border-border bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground">
                      Email and password changes are available for registered accounts. Guest sessions do not have account credentials.
                    </p>
                  ) : (
                    <>
                      <form
                        onSubmit={pendingEmail ? handleEmailChangeVerify : handleEmailChangeRequest}
                        className="space-y-3"
                      >
                        <div>
                          <h3 className="text-sm font-medium">Change email</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {pendingEmail
                              ? `Enter the 6-digit code sent to ${pendingEmail}.`
                              : "We’ll send a verification code to your new address."}
                          </p>
                        </div>
                        {!pendingEmail ? (
                          <>
                            <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-new-email">
                              New email address
                              <input
                                id="settings-new-email"
                                type="email"
                                autoComplete="email"
                                maxLength={254}
                                required
                                value={newEmail}
                                onChange={(event) => {
                                  setNewEmail(event.target.value);
                                  setEmailChangeError(null);
                                }}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="name@example.com"
                              />
                            </label>
                            <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-email-password">
                              Current password
                              <input
                                id="settings-email-password"
                                type="password"
                                autoComplete="current-password"
                                value={emailPassword}
                                onChange={(event) => setEmailPassword(event.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Required for password-protected accounts"
                              />
                            </label>
                          </>
                        ) : (
                          <>
                            <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-email-code">
                              Verification code
                              <input
                                id="settings-email-code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                value={emailCode}
                                onChange={(event) => {
                                  setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                                  setEmailChangeError(null);
                                }}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm tracking-[0.3em] text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="000000"
                              />
                            </label>
                            {emailDemoCode && (
                              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-center text-xs text-primary">
                                Demo verification code: <strong className="font-mono">{emailDemoCode}</strong>
                              </p>
                            )}
                          </>
                        )}
                        {emailChangeError && (
                          <p role="alert" className="text-xs text-destructive">{emailChangeError}</p>
                        )}
                        <div className="flex justify-end gap-2">
                          {pendingEmail && (
                            <button
                              type="button"
                              disabled={credentialsBusy}
                              onClick={() => {
                                setPendingEmail(null);
                                setEmailCode("");
                                setEmailDemoCode(null);
                                setEmailChangeError(null);
                              }}
                              className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={credentialsBusy}
                            className="syn-btn-primary rounded-md bg-[var(--syntra-orange)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            {credentialsBusy
                              ? "Please wait…"
                              : pendingEmail
                                ? "Verify email"
                                : "Send verification code"}
                          </button>
                        </div>
                      </form>

                      <form onSubmit={handlePasswordChange} className="space-y-3 border-t border-border pt-4">
                        <div>
                          <h3 className="text-sm font-medium">Change password</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Use your current password and choose a new one.
                          </p>
                        </div>
                        <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-current-password">
                          Current password
                          <input
                            id="settings-current-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                        <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-new-password">
                          New password
                          <input
                            id="settings-new-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            required
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                        <label className="block space-y-1.5 text-xs font-medium" htmlFor="settings-confirm-password">
                          Confirm new password
                          <input
                            id="settings-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            required
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                        {passwordChangeError && (
                          <p role="alert" className="text-xs text-destructive">{passwordChangeError}</p>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={credentialsBusy}
                            className="syn-btn-primary rounded-md bg-[var(--syntra-orange)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            {credentialsBusy ? "Please wait…" : "Update password"}
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Passwords must be 8–128 characters and include an uppercase letter, a lowercase letter, and a number.
                        </p>
                      </form>
                    </>
                  )}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <h3 className="text-sm font-medium">Account</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Identity and access for this session.
                    </p>
                  </div>
                  <dl className="grid gap-3 rounded-lg border border-border bg-card/60 p-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-[11px] text-muted-foreground">Email</dt>
                      <dd className="mt-1 truncate text-sm">{user?.email || "Not provided"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] text-muted-foreground">Phone</dt>
                      <dd className="mt-1 truncate text-sm">{user?.phone || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Access level</dt>
                      <dd className="mt-1 capitalize text-sm">{user?.role ?? "Guest"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Verification</dt>
                      <dd className="mt-1 inline-flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                        {user?.is_verified ? "Verified" : "Unverified"}
                      </dd>
                    </div>
                    {user?.created_at && (
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] text-muted-foreground">Member since</dt>
                        <dd className="mt-1 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )}

      {/* Brand — the mark doubles as the expand control when collapsed */}
      <div className={cn("flex items-center gap-2.5 px-4 pb-2 pt-5", collapsed && "justify-center px-0")}>
        {collapsed ? (
          onToggleCollapse ? (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-sidebar-accent"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={onToggleCollapse}
            >
              <SyntraMark size={26} />
            </button>
          ) : (
            <SyntraMark size={26} />
          )
        ) : (
          <SyntraLogo size={26} />
        )}
        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="mt-2 flex flex-col gap-1 px-2.5" aria-label="Primary">
        <button type="button" className={cn("syn-nav-item", active === "investigate" && "active")} onClick={() => go("investigate")} title="Investigate">
          <Radar className="size-4 shrink-0" />
          {!collapsed && <span>Investigate</span>}
        </button>
        <button type="button" className={cn("syn-nav-item", active === "history" && "active")} onClick={() => go("history")} title="History">
          <History className="size-4 shrink-0" />
          {!collapsed && <span>History</span>}
        </button>
        <button type="button" className={cn("syn-nav-item", active === "about" && "active")} onClick={() => go("about")} title="About">
          <Info className="size-4 shrink-0" />
          {!collapsed && <span>About</span>}
        </button>
      </nav>

      {/* Recent investigations — chat-title style; hidden while collapsed */}
      {!collapsed && (
        <>
          <hr className="syn-nav-divider" />
          <p className="syn-section-title px-4 pb-1.5 pt-1">Recent</p>
          {recent === null ? (
            <div className="syn-recent-list px-1.5 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="syn-sweep h-6 rounded-md" aria-hidden="true" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-4 pb-2 text-[11px] leading-relaxed text-muted-foreground">
              Conversations you start appear here for this session so you can reopen them.
            </p>
          ) : (
            <div className="syn-recent-list" role="list" aria-label="Recent conversations">
              {recent.slice(0, RECENT_LIMIT).map((item) => (
                <div key={item.threadId} role="listitem">
                  <RecentItem
                    item={item}
                    active={item.threadId === activeThreadId}
                    onOpen={(id) => {
                      onRestoreInvestigation(id);
                      onNavigateAway();
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* Account — Windows 11-style flyout: the Session row opens an account
          menu with the identity header, workspace actions and Log out. */}
      <div className="flex flex-col gap-1 px-2.5 pb-4">
        <hr className="syn-nav-divider mt-0 mb-1" />
        {!collapsed && (
          <details ref={sessionMenuRef} className="syn-session-details">
            <summary className="syn-session-trigger" title="Session menu">
              <CircleUserRound className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">Session</span>
              <ChevronRight className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
            </summary>
            <div className="syn-session-menu syn-session-menu-inline" role="menu">
              {/* Identity header */}
              <div className="syn-session-menu-header" role="presentation">
                <span className="syn-session-avatar" aria-hidden="true">
                  {avatarInitials}
                </span>
                <span className="min-w-0">
                  <span className="syn-session-menu-header-name">{userName}</span>
                  <span className="syn-session-menu-header-meta truncate">{userMeta}</span>
                </span>
                <ChevronRight className="syn-session-menu-header-chevron size-4" aria-hidden="true" />
              </div>
              <hr data-slot="dropdown-menu-separator" />
              <button data-slot="dropdown-menu-item" role="menuitem" type="button"
                onClick={() => {
                  onNavigate("about");
                  onNavigateAway();
                }}
              >
                <Sparkles className="size-4 shrink-0" aria-hidden="true" />
                <span>About SYNTRA</span>
              </button>
              <button data-slot="dropdown-menu-item" role="menuitem" type="button"
                onClick={() => {
                  onNavigate("about");
                  onNavigateAway();
                }}
              >
                <LifeBuoy className="size-4 shrink-0" aria-hidden="true" />
                <span>Help &amp; principles</span>
              </button>
              <button
                data-slot="dropdown-menu-item"
                role="menuitem"
                type="button"
                onClick={() => {
                  setProfileName(user?.name ?? "");
                  setProfileNameError(null);
                  setSettingsOpen(true);
                  sessionMenuRef.current?.removeAttribute("open");
                }}
              >
                <Settings className="size-4 shrink-0" aria-hidden="true" />
                <span>Settings</span>
              </button>
              <hr data-slot="dropdown-menu-separator" />
              <button data-slot="dropdown-menu-item" data-variant="destructive" role="menuitem" type="button" onClick={() => void handleSignOut()}>
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </details>
        )}
      </div>

      {collapsed && onToggleCollapse && (
        <button
          type="button"
          className="mx-auto mb-4 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Expand sidebar"
          onClick={onToggleCollapse}
        >
          <Menu className="size-4" />
        </button>
      )}
    </>
  );
}

export function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  onRestoreInvestigation,
  activeThreadId,
}: SidebarProps) {
  // Read the persisted preference lazily so no effect-driven setState is needed.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage failures; UI state only.
      }
      return next;
    });
  }, []);

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={cn("syn-sidebar hidden md:flex", collapsed && "collapsed")}
        aria-label="SYNTRA navigation"
      >
        {/* Keyed by collapsed state so the entrance animation replays on expand */}
        <div className="syn-sidebar-inner" key={collapsed ? "collapsed" : "expanded"}>
          <SidebarContent
            active={active}
            onNavigate={onNavigate}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
            onNavigateAway={() => undefined}
            onRestoreInvestigation={onRestoreInvestigation}
            activeThreadId={activeThreadId}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="SYNTRA navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <div className="syn-sidebar absolute inset-y-0 left-0 w-64 shadow-2xl">
            <SidebarContent
              active={active}
              onNavigate={onNavigate}
              collapsed={false}
              onNavigateAway={onClose}
              onRestoreInvestigation={onRestoreInvestigation}
              activeThreadId={activeThreadId}
            />
          </div>
        </div>
      )}
    </>
  );
}
