"use client";

import { useEffect, useMemo, useState } from "react";
import type { FirebaseConfig, FirebaseUser } from "../lib/firebase-client";
import { getFirebase } from "../lib/firebase-client";

type AuthPhase = "loading" | "ready" | "error";

type AuthState = {
  phase: AuthPhase;
  user?: FirebaseUser;
  message?: string;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const gradientColors = ["from-slate-950", "via-indigo-900", "to-purple-800"];

const sampleTasks = [
  { title: "Team standup", detail: "Prep notes and blockers before 9AM" },
  { title: "Design review", detail: "Finalize the sprint handoff deck" },
  { title: "Customer follow-up", detail: "Send recap to the Pilot team" },
];

export default function Home() {
  const missingConfig = useMemo(
    () =>
      Object.entries(firebaseConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key.replace("authDomain", "auth domain")),
    [],
  );

  const [authState, setAuthState] = useState<AuthState>(() =>
    missingConfig.length > 0
      ? {
          phase: "error",
          message: `Add the missing Firebase env vars: ${missingConfig.join(", ")}`,
        }
      : { phase: "loading" },
  );
  const [actionMessage, setActionMessage] = useState<string>("");

  useEffect(() => {
    if (missingConfig.length > 0) return undefined;

    let unsubscribe: (() => void) | undefined;

    getFirebase(firebaseConfig)
      .then(({ auth }) => {
        unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
          setAuthState({
            phase: "ready",
            user: firebaseUser ?? undefined,
          });
        });
      })
      .catch((error: Error) => {
        setAuthState({ phase: "error", message: error.message });
      });

    return () => unsubscribe?.();
  }, [missingConfig]);

  const handleGoogleSignIn = async () => {
    setActionMessage("Signing you in with Google…");
    try {
      const { firebase, auth } = await getFirebase(firebaseConfig);
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      setActionMessage("Welcome back! Redirecting to your tasks.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in right now.";
      setActionMessage(message);
    }
  };

  const handleSignOut = async () => {
    setActionMessage("Signing you out…");
    try {
      const { auth } = await getFirebase(firebaseConfig);
      await auth.signOut();
      setActionMessage("You are signed out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out.";
      setActionMessage(message);
    }
  };

  const user = authState.user;
  const showLoading = authState.phase === "loading";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientColors.join(" ")} text-zinc-50`}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
        <div className="grid grid-cols-1 gap-8 rounded-3xl bg-white/5 p-10 backdrop-blur-xl ring-1 ring-white/10 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100 ring-1 ring-white/10">
              TaskManager
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Secure, on-brand access to your task hub.
            </h1>
            <p className="text-lg leading-relaxed text-indigo-100">
              Sign in with Firebase to sync your tasks, keep everything private, and stay aligned with the TaskManager brand experience.
            </p>
            <div className="grid gap-3 text-sm text-indigo-100">
              {[
                "Google-backed authentication via Firebase",
                "Real-time session awareness before loading tasks",
                "Polished UI that matches the brand gradients",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl bg-zinc-950/60 p-8 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">Authentication</p>
                <h2 className="text-2xl font-semibold text-white">Access your workspace</h2>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 ring-2 ring-indigo-300/40" />
            </div>

            {authState.phase === "error" && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {authState.message}
              </div>
            )}

            {showLoading && (
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-indigo-100 ring-1 ring-white/10">
                <span className="h-3 w-3 animate-ping rounded-full bg-indigo-300" aria-hidden />
                Checking your session…
              </div>
            )}

            {!showLoading && !user && authState.phase === "ready" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-indigo-100 ring-1 ring-white/10">
                  Use your Google account to authenticate with Firebase before entering the task workspace.
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-semibold text-zinc-900 transition hover:translate-y-[1px] hover:bg-indigo-50"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Continue with Google
                </button>
              </div>
            )}

            {user && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 ring-1 ring-emerald-400/40">
                  Signed in as <span className="font-semibold">{user.email || user.displayName}</span>.
                </div>
                <div className="grid gap-3">
                  {sampleTasks.map((task) => (
                    <div key={task.title} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-indigo-50 ring-1 ring-white/10">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{task.title}</p>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                      </div>
                      <p className="text-indigo-100">{task.detail}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Sign out
                </button>
              </div>
            )}

            {actionMessage && (
              <p className="text-center text-xs text-indigo-200" role="status">
                {actionMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
