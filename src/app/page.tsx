"use client";

import { useEffect, useMemo, useState } from "react";

import { type FirebaseConfig, type FirebaseUser, getFirebase } from "@/lib/firebase-client";

type AuthState =
  | { phase: "loading" }
  | { phase: "ready"; user?: FirebaseUser }
  | { phase: "error"; message: string };

const palette = {
  lilac500: "#816e91",
  slate500: "#3d7f7b",
  granite900: "#171c1b",
  granite200: "#e8ecec",
};

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

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

  const user = authState.phase === "ready" ? authState.user : undefined;
  const showLoading = authState.phase === "loading";
  const hasError = authState.phase === "error";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_15%,#f3f0f7,transparent_30%),radial-gradient(circle_at_70%_10%,#e5f0f0,transparent_30%),radial-gradient(circle_at_40%_70%,#f4f5f7,transparent_30%)] text-[#171c1b]">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl" style={{ background: palette.lilac500 }} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#5a4d65]">TaskManager</p>
              <p className="text-lg font-semibold text-[#221c28]">Your organized day starts here</p>
            </div>
          </div>
          <div className="hidden gap-4 text-sm font-semibold text-[#3f3a45] sm:flex">
            <span>Productivity</span>
            <span>Security</span>
            <span>Support</span>
          </div>
          <div className="text-sm font-semibold text-[#3f3a45]">
            {user ? `Signed in as ${user.email ?? "team member"}` : "Secure workspace"}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4e4257] shadow-sm ring-1 ring-[#e6e2e9]">
            Built for busy teams
            <span className="h-2 w-2 rounded-full" style={{ background: palette.slate500 }} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#1c1622] md:text-5xl">A focused landing for getting into TaskManager fast.</h1>
            <p className="max-w-2xl text-lg text-[#4e4257]">
              TaskManager keeps every assignment, due date, and update in one place. Sign in to unlock your board, receive smart reminders, and keep the whole crew aligned.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Stay on top of deadlines", "Share updates instantly", "Keep clients in the loop", "Sign in securely with Google"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-[#e6e2e9]">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: palette.lilac500 }}>
                  ✓
                </span>
                <p className="text-sm text-[#2f2735]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-[0_18px_60px_rgba(26,22,29,0.08)] ring-1 ring-[#e6e2e9]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-[#5a4d65]">Access</p>
            <h2 className="text-2xl font-semibold text-[#1c1622]">Sign in to your workspace</h2>
            <p className="text-sm text-[#4e4257]">
              Use your Google account to jump back into TaskManager. Your tasks, comments, and notifications are protected with Firebase authentication.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f7f8f9] p-4 text-sm text-[#2f2735] ring-1 ring-[#e6e2e9]">
            <p className="font-semibold text-[#1c1622]">Status</p>
            {hasError && <p className="mt-1 text-[#9b1c1c]">{authState.message}</p>}
            {!hasError && showLoading && <p className="mt-1 text-[#4e4257]">Checking your session…</p>}
            {!hasError && !showLoading && (
              <p className="mt-1 text-[#4e4257]">{user ? "You are signed in and ready to manage tasks." : "You are signed out. Sign in to see your boards."}</p>
            )}
            {actionMessage && <p className="mt-2 text-[#3f3a45]">{actionMessage}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${palette.lilac500}, ${palette.slate500})` }}
              onClick={user ? handleSignOut : handleGoogleSignIn}
              disabled={showLoading || hasError}
            >
              {user ? "Sign out" : "Sign in with Google"}
            </button>
            <div className="rounded-full border border-[#d7d1dc] bg-white px-4 py-2 text-sm font-semibold text-[#3f3a45]">
              Secure access powered by Firebase
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e2e9] bg-white/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-6 text-sm text-[#4e4257] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl" style={{ background: palette.lilac500 }} />
            <p className="font-semibold text-[#1c1622]">TaskManager</p>
          </div>
          <p>Simple sign-in. Full access to every task.</p>
          <div className="flex gap-4 font-semibold text-[#3f3a45]">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
