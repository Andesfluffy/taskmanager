"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getFirebaseEnv } from "@/lib/env";
import { type FirebaseConfig, type FirebaseUser, getFirebase } from "@/lib/firebase-client";

type AuthState =
  | { phase: "loading" }
  | { phase: "ready"; user?: FirebaseUser }
  | { phase: "error"; message: string };

type Task = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "High" | "Medium" | "Low";
};

let firebaseConfig: FirebaseConfig | undefined;
let firebaseEnvError: string | undefined;

try {
  firebaseConfig = getFirebaseEnv();
} catch (error) {
  firebaseEnvError = error instanceof Error ? error.message : "Unable to read Firebase env vars.";
  firebaseConfig = undefined;
}

const defaultTasks: Task[] = [
  { id: "1", title: "Draft sprint goals", status: "todo", priority: "High" },
  { id: "2", title: "Confirm stakeholder list", status: "todo", priority: "Medium" },
  { id: "3", title: "Review blockers", status: "doing", priority: "High" },
  { id: "4", title: "Share daily recap", status: "done", priority: "Low" },
];

export default function TasksPage() {
  const router = useRouter();
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
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

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

  useEffect(() => {
    if (authState.phase !== "ready") return;
    if (!authState.user) {
      const timer = setTimeout(() => router.replace("/"), 400);
      return () => clearTimeout(timer);
    }
  }, [authState, router]);

  const handleSignOut = async () => {
    setActionMessage("Signing you out…");
    try {
      const { auth } = await getFirebase(firebaseConfig);
      await auth.signOut();
      router.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out.";
      setActionMessage(message);
    }
  };

  const handleAdvance = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        if (task.status === "todo") return { ...task, status: "doing" };
        if (task.status === "doing") return { ...task, status: "done" };
        return task;
      }),
    );
  };

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    setTasks((prev) => [
      { id: crypto.randomUUID(), title, status: "todo", priority: "Medium" },
      ...prev,
    ]);
    setNewTaskTitle("");
  };

  const readyUser = authState.phase === "ready" ? authState.user : undefined;
  const groupedTasks = tasks.reduce<Record<Task["status"], Task[]>>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    { todo: [], doing: [], done: [] },
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,#d7f5ed,transparent_32%),radial-gradient(circle_at_82%_8%,#e4fbf6,transparent_28%),radial-gradient(circle_at_50%_90%,#ccf0e7,transparent_32%)] text-[#0f2b2a]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:py-14">
        <header className="flex flex-col gap-4 rounded-3xl bg-white/85 p-6 shadow-[0_20px_70px_rgba(10,41,38,0.08)] ring-1 ring-[#dbe8e6] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#2f5653]">TaskManager</p>
            <h1 className="text-3xl font-semibold text-[#0f2b2a]">Workspace</h1>
            <p className="text-sm text-[#2f5653]">Stay signed in to keep momentum. Every task stays private to your session.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#2f5653]">
            {readyUser && <span className="rounded-full bg-[#ecf7f4] px-3 py-1">{readyUser.email ?? "Signed in"}</span>}
            <button
              className="rounded-full bg-[#2ec4b6] px-5 py-2 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleSignOut}
              disabled={authState.phase === "loading"}
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-[0_22px_70px_rgba(10,41,38,0.12)] ring-1 ring-[#dbe8e6]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#2f5653]">Today</p>
              <h2 className="text-2xl font-semibold text-[#0f2b2a]">Make a move and ship</h2>
              <p className="text-sm text-[#2f5653]">Advance tasks column by column. Everything here is your focused queue.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                className="w-full max-w-xs rounded-full border border-[#d6ece8] bg-white px-4 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                placeholder="Add a quick task"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleAddTask();
                }}
              />
              <button
                className="rounded-full bg-[#2ec4b6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(
              [
                { key: "todo", title: "To do" },
                { key: "doing", title: "In progress" },
                { key: "done", title: "Done" },
              ] as const
            ).map(({ key, title }) => (
              <div key={key} className="flex flex-col gap-3 rounded-2xl bg-[#f6fbf9] p-4 ring-1 ring-[#dbe8e6]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#0f2b2a]">{title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2f5653] shadow-sm ring-1 ring-[#d6ece8]">
                    {groupedTasks[key].length} tasks
                  </span>
                </div>
                <div className="space-y-3">
                  {groupedTasks[key].length === 0 && (
                    <p className="rounded-xl bg-white px-3 py-3 text-sm text-[#2f5653] ring-1 ring-dashed ring-[#cde9e0]">
                      Nothing here yet. Add a task to keep momentum.
                    </p>
                  )}
                  {groupedTasks[key].map((task) => (
                    <article key={task.id} className="rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#dbe8e6]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0f2b2a]">{task.title}</p>
                        <span className="rounded-full bg-[#ecf7f4] px-3 py-1 text-xs font-semibold text-[#2f5653]">{task.priority}</span>
                      </div>
                      {task.status !== "done" && (
                        <button
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d6ece8] px-3 py-2 text-xs font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
                          onClick={() => handleAdvance(task.id)}
                        >
                          Move to {task.status === "todo" ? "In progress" : "Done"}
                        </button>
                      )}
                      {task.status === "done" && (
                        <p className="mt-3 text-xs text-[#2f5653]">Completed and ready to report.</p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 rounded-3xl bg-white/85 px-6 py-6 text-sm text-[#2f5653] shadow-[0_20px_70px_rgba(10,41,38,0.08)] ring-1 ring-[#dbe8e6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#66e0cc] via-[#3cd3ba] to-[#1da68a]" />
            <p className="font-semibold text-[#0f2b2a]">TaskManager</p>
          </div>
          <p className="text-sm">Signed in? Then you are where the work happens.</p>
          <p className="text-sm text-[#2f5653]">Need help? Sign out and revisit the home page for guidance.</p>
        </footer>

        {(actionMessage || (authState.phase === "ready" && !authState.user)) && (
          <div className="rounded-2xl bg-[#f0fbf7] p-4 text-sm text-[#0f2b2a] ring-1 ring-[#dbe8e6]">
            {actionMessage || "Sign in to reach the task manager."}
          </div>
        )}
      </div>
    </div>
  );
}
