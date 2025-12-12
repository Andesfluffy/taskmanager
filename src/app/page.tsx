"use client";

import { useEffect, useMemo, useState } from "react";

import { getFirebaseEnv } from "@/lib/env";
import { type FirebaseConfig, type FirebaseUser, getFirebase } from "@/lib/firebase-client";

type AuthState =
  | { phase: "loading" }
  | { phase: "ready"; user?: FirebaseUser }
  | { phase: "error"; message: string };

const palette = {
  mint: "#2ec4b6",
  mintLight: "#c9f2ea",
  deepTeal: "#0f2b2a",
  fog: "#f4fbf9",
  stone: "#3f5b59",
};

let firebaseConfig: FirebaseConfig | undefined;
let firebaseEnvError: string | undefined;

try {
  firebaseConfig = getFirebaseEnv();
} catch (error) {
  firebaseEnvError = error instanceof Error ? error.message : "Unable to read Firebase env vars.";
  firebaseConfig = undefined;
}

export default function Home() {
  const missingConfig = useMemo(() => {
    if (!firebaseConfig) return ["Firebase configuration"];

    return Object.entries(firebaseConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key.replace("authDomain", "auth domain"));
  }, []);

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (firebaseEnvError) {
      return { phase: "error", message: firebaseEnvError };
    }

    return missingConfig.length > 0
      ? {
          phase: "error",
          message: `Add the missing Firebase env vars: ${missingConfig.join(", ")}`,
        }
      : { phase: "loading" };
  });
  const [actionMessage, setActionMessage] = useState<string>("");

  useEffect(() => {
    if (missingConfig.length > 0 || !firebaseConfig) return undefined;

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

  const statItems = [
    { label: "Team clarity", value: "98%" },
    { label: "Avg. response", value: "< 2m" },
    { label: "Boards secured", value: "1,200+" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,#d7f5ed,transparent_32%),radial-gradient(circle_at_82%_8%,#e4fbf6,transparent_28%),radial-gradient(circle_at_50%_90%,#ccf0e7,transparent_32%)] text-[#0f2b2a]">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 lg:py-14">
        <header className="flex flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-[0_20px_70px_rgba(10,41,38,0.08)] ring-1 ring-[#dbe8e6] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#66e0cc] via-[#3cd3ba] to-[#1da68a] text-white shadow-lg">
              TM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#2f5653]">TaskManager</p>
              <p className="text-lg font-semibold text-[#0f2b2a]">Professional tasks in mint & white</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#2f5653]">
            <span className="rounded-full bg-[#ecf7f4] px-3 py-1">Guided workflows</span>
            <span className="rounded-full bg-[#ecf7f4] px-3 py-1">Secure access</span>
            <span className="rounded-full bg-[#ecf7f4] px-3 py-1">Always on</span>
            <span className="rounded-full bg-[#ecf7f4] px-3 py-1">
              {user ? `Signed in: ${user.email ?? "team member"}` : "Status: offline"}
            </span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="space-y-8">
            <h1 className="text-4xl font-semibold leading-tight text-[#0f2b2a] md:text-5xl">Simple task home.</h1>
            <p className="max-w-2xl text-lg text-[#2f5653]">
              A mint and white space that stays calm, keeps owners clear, and gets you into your boards fast.
            </p>
            <button
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${palette.mint}, #1aa38d)` }}
              onClick={user ? handleSignOut : handleGoogleSignIn}
              disabled={showLoading || hasError}
            >
              {user ? "Sign out" : "Sign in with Google"}
              <span aria-hidden className="text-base">→</span>
            </button>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#2f5653] shadow-sm ring-1 ring-[#dce9e6]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.mint }} />
              Secure Google access. No extra steps.
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {statItems.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-[#dbe8e6]">
                  <p className="text-2xl font-semibold text-[#0f2b2a]">{stat.value}</p>
                  <p className="text-sm text-[#2f5653]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {["Pin priorities", "Assign quickly", "Stay private"].map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-[#dbe8e6]">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-[#66e0cc] via-[#3cd3ba] to-[#1da68a]" />
                  <p className="text-sm font-semibold text-[#0f2b2a]">{feature}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5 rounded-3xl bg-white/90 p-6 shadow-[0_22px_70px_rgba(10,41,38,0.12)] ring-1 ring-[#dbe8e6]">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[#2f5653]">Access</p>
              <h2 className="text-2xl font-semibold text-[#0f2b2a]">Sign in to your workspace</h2>
              <p className="text-sm text-[#2f5653]">
                Use Google to jump into TaskManager. Your boards stay private and ready the moment you arrive.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f6fbf9] p-4 text-sm text-[#1f4744] ring-1 ring-[#dbe8e6]">
              <p className="font-semibold text-[#0f2b2a]">Status</p>
              {hasError && <p className="mt-1 text-[#9b1c1c]">{authState.message}</p>}
              {!hasError && showLoading && <p className="mt-1 text-[#2f5653]">Checking your session…</p>}
              {!hasError && !showLoading && (
                <p className="mt-1 text-[#2f5653]">{user ? "You're signed in—open your tasks and keep moving." : "You're signed out. Sign in to see your boards."}</p>
              )}
              {actionMessage && <p className="mt-2 text-[#2f5653]">{actionMessage}</p>}
            </div>

            <div className="space-y-3 rounded-2xl bg-[#ecf7f4] p-4 ring-1 ring-[#d6ece8]">
              <p className="text-sm font-semibold text-[#0f2b2a]">What you get</p>
              <ul className="space-y-2 text-sm text-[#2f5653]">
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0f2b2a] shadow-sm ring-1 ring-[#d6ece8]">
                    ✓
                  </span>
                  Instant access to team boards
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0f2b2a] shadow-sm ring-1 ring-[#d6ece8]">
                    ✓
                  </span>
                  Privacy-first authentication
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0f2b2a] shadow-sm ring-1 ring-[#d6ece8]">
                    ✓
                  </span>
                  A calmer workspace aesthetic
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-[#b6dcd4] bg-[#f9fefd] px-4 py-5 text-sm text-[#2f5653]">
              <p className="font-semibold text-[#0f2b2a]">Guidance</p>
              <p className="mt-1">We designed this home experience for smooth onboarding. Add Firebase credentials to keep it live.</p>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-3 rounded-3xl bg-white/80 px-6 py-6 text-sm text-[#2f5653] shadow-[0_20px_70px_rgba(10,41,38,0.08)] ring-1 ring-[#dbe8e6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#66e0cc] via-[#3cd3ba] to-[#1da68a]" />
            <p className="font-semibold text-[#0f2b2a]">TaskManager</p>
          </div>
          <p className="text-sm">Simple sign-in. Full access to every task.</p>
          <div className="flex gap-4 font-semibold text-[#2f5653]">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
