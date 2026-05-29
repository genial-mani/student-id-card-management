"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface CredentialsModalProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

interface CredentialInfo {
  username: string;
  createdAt: string;
}

export default function CredentialsModal({
  schoolId,
  schoolName,
  onClose,
}: CredentialsModalProps) {
  const [info, setInfo] = useState<CredentialInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState<"user" | "pass" | "all" | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState("");

  // Load existing username
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/schools/${schoolId}/credentials`);
        if (res.ok) {
          const d = await res.json();
          setInfo({ username: d.username, createdAt: d.createdAt });
        } else {
          setError("Could not load credentials.");
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, [schoolId]);

  const handleReset = async () => {
    setResetting(true);
    setNewPassword(null);
    setError("");
    try {
      const res = await fetch(`/api/schools/${schoolId}/credentials`, {
        method: "POST",
      });
      if (res.ok) {
        const d = await res.json();
        setInfo((prev) => (prev ? { ...prev, username: d.username } : prev));
        setNewPassword(d.password);
        setConfirmReset(false);
      } else {
        setError("Failed to reset credentials.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setResetting(false);
    }
  };

  const copy = async (text: string, key: "user" | "pass" | "all") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const password = newPassword ?? "••••••••••";
  const hasNewPw = newPassword !== null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">
              School Credentials
            </h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">
              {schoolName}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-gray-400 hover:text-white transition-colors p-2"
            onClick={onClose}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className="p-6">
          {/* Loading */}
          {loadingInfo && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Credentials display */}
          {!loadingInfo && info && (
            <>
              {/* Info banner */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                <svg
                  className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-blue-700">
                  Share these credentials with school staff. The password is
                  only shown after a reset.
                </p>
              </div>

              {/* New password banner */}
              {hasNewPw && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                  <svg
                    className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-amber-700 font-medium">
                    New password generated. Save it now — it won't be shown
                    again.
                  </p>
                </div>
              )}

              {/* Credential fields */}
              <div className="space-y-3 mb-6">
                {/* Username */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Username
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-800 select-all">
                      {info.username}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 p-2.5 rounded-xl text-gray-600"
                      onClick={() => copy(info.username, "user")}
                      title="Copy username"
                    >
                      {copied === "user" ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Password{" "}
                    {!hasNewPw && (
                      <span className="font-normal normal-case text-gray-400">
                        (hidden — reset to reveal)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className={`flex-1 border rounded-xl px-4 py-2.5 font-mono text-sm select-all ${
                        hasNewPw
                          ? "bg-amber-50 border-amber-200 text-gray-800"
                          : "bg-gray-50 border-gray-200 text-gray-400 tracking-widest"
                      }`}
                    >
                      {password}
                    </code>
                    {hasNewPw && (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 p-2.5 rounded-xl text-gray-600"
                        title="Copy password"
                        onClick={() => copy(newPassword!, "pass")}
                      >
                        {copied === "pass" ? (
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Copy all + download (only when password is visible) */}
              {hasNewPw && (
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      copy(
                        `Username: ${info.username}\nPassword: ${newPassword}`,
                        "all",
                      )
                    }
                  >
                    {copied === "all" ? (
                      <>
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>{" "}
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>{" "}
                        Copy Both
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const txt = `School: ${schoolName}\nUsername: ${info.username}\nPassword: ${newPassword}\n\nKeep this secure.`;
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(
                        new Blob([txt], { type: "text/plain" }),
                      );
                      a.download = `${schoolName.replace(/\s+/g, "_")}_credentials.txt`;
                      a.click();
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download .txt
                  </Button>
                </div>
              )}

              {/* Reset section */}
              <div className="border-t border-gray-100 pt-4">
                {!confirmReset ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-red-700 font-medium text-sm"
                    onClick={() => setConfirmReset(true)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Reset Password (Generate New)
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 text-center mb-3">
                      This will invalidate the current password. The school user
                      will need the new password to log in.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirmReset(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={resetting}
                        onClick={handleReset}
                      >
                        {resetting ? "Resetting…" : "Confirm Reset"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
