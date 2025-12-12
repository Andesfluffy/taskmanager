"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { type FirebaseConfig, type FirebaseUser, getFirebase } from "@/lib/firebase-client";

type AuthState =
  | { phase: "loading" }
  | { phase: "ready"; user?: FirebaseUser }
  | { phase: "error"; message: string };

const palette = {
  lilac500: "#6454d6",
  teal500: "#2d897a",
  ink900: "#0b1221",
  ink800: "#1a2030",
  stone200: "#e9e7ef",
};

const brandGradient = `linear-gradient(135deg, ${palette.lilac500}, ${palette.teal500})`;

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#f4f2ff_0,transparent_30%),radial-gradient(circle_at_85%_10%,#e3f3ee_0,transparent_28%),radial-gradient(circle_at_50%_85%,#f7f8fb_0,transparent_32%)] text-[#0b1221]">
      <header className="border-b border-white/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ background: brandGradient }}>
              TM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#4b4557]">TaskManager</p>
              <p className="text-lg font-semibold text-[#0f172a]">Plan, assign, finish</p>
            </div>
          </div>
          <div className="hidden gap-6 text-sm font-semibold text-[#1f2937] sm:flex">
            <span>Realtime updates</span>
            <span>Private by default</span>
            <span>Team-ready</span>
          </div>
          <div className="text-sm font-semibold text-[#1f2937]">
            {user ? `Signed in as ${user.email ?? "team member"}` : "Secure workspace"}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#3c3350] shadow-sm ring-1 ring-[#e8e2f7]">
            Built for momentum
            <span className="h-2 w-2 rounded-full" style={{ background: palette.teal500 }} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#0f172a] md:text-5xl">
              A calmer way to run every task list.
            </h1>
            <p className="max-w-2xl text-lg text-[#1f2937]">
              TaskManager keeps owners, priorities, and progress aligned. Sign in to sync your work and move the right items forward—fast.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Prioritize with clarity", "Broadcast updates", "Ship on time"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#dedbe6]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: palette.lilac500 }}>
                  ✓
                </span>
                <p className="text-sm font-semibold text-[#0f172a]">{item}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(16,17,38,0.08)] ring-1 ring-[#dedbe6]">
              <p className="text-sm font-semibold text-[#0f172a]">Trusted rhythm</p>
              <p className="mt-1 text-sm text-[#1f2937]">Daily cadence cards keep everyone aligned without noise.</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(16,17,38,0.08)] ring-1 ring-[#dedbe6]">
              <p className="text-sm font-semibold text-[#0f172a]">Clean visibility</p>
              <p className="mt-1 text-sm text-[#1f2937]">Boards, owners, and blockers in one calm workspace.</p>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow-[0_18px_60px_rgba(26,22,29,0.12)] ring-1 ring-[#dedbe6]">
          <div className="overflow-hidden rounded-2xl bg-[#0c1629] text-white shadow-inner">
            <div className="grid gap-0 sm:grid-cols-2">
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">Access</p>
                <h2 className="mt-2 text-2xl font-semibold">Sign in to your workspace</h2>
                <p className="mt-2 text-sm text-white/85">
                  Use Google to open your boards instantly. Your tasks stay private, synced, and ready.
                </p>
              </div>
              <div className="relative min-h-[220px]">
                <Image
                  alt="Organized project board showing to-do, doing, and done columns"
                  className="h-full w-full object-cover"
                  height={320}
                  src="https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=960&q=80"
                  width={640}
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1629]/65 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f7f7fb] p-4 text-sm text-[#111827] ring-1 ring-[#dedbe6]">
            <p className="font-semibold text-[#0f172a]">Status</p>
            {hasError && <p className="mt-1 text-[#b91c1c]">{authState.message}</p>}
            {!hasError && showLoading && <p className="mt-1 text-[#1f2937]">Checking your session…</p>}
            {!hasError && !showLoading && (
              <p className="mt-1 text-[#1f2937]">{user ? "You're signed in—open your tasks and keep moving." : "You're signed out. Sign in to see your boards."}</p>
            )}
            {actionMessage && <p className="mt-2 text-[#1f2937]">{actionMessage}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: brandGradient }}
              onClick={user ? handleSignOut : handleGoogleSignIn}
              disabled={showLoading || hasError}
            >
              {user ? "Sign out" : "Sign in with Google"}
            </button>
            <div className="rounded-full border border-[#d7d1dc] bg-white px-4 py-2 text-sm font-semibold text-[#1f2937]">
              Secure access powered by Firebase
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dedbe6] bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-[#1f2937] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl" style={{ background: brandGradient }} />
            <p className="font-semibold text-[#0f172a]">TaskManager</p>
          </div>
          <p>Keep momentum. Protect focus. Finish work.</p>
          <div className="flex gap-4 font-semibold text-[#1f2937]">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
