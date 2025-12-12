"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Toast = {
  id: string;
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
};

let firebaseConfig: FirebaseConfig | undefined;
let firebaseEnvError: string | undefined;

try {
  firebaseConfig = getFirebaseEnv();
} catch (error) {
  firebaseEnvError = error instanceof Error ? error.message : "Unable to read Firebase env vars.";
  firebaseConfig = undefined;
}

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
  const [newTask, setNewTask] = useState<Pick<Task, "title" | "status" | "priority">>({
    title: "",
    status: "todo",
    priority: "Medium",
  });
  const [newTaskError, setNewTaskError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Pick<Task, "title" | "status" | "priority"> | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const hasLoadedTasks = useRef(false);

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

  useEffect(() => {
    if (authState.phase !== "ready" || !authState.user || hasLoadedTasks.current) return;
    hasLoadedTasks.current = true;
    void loadTasks();
  }, [authState, loadTasks]);

  const handleSignOut = async () => {
    setActionMessage("Signing you out…");
    try {
      if (!firebaseConfig) throw new Error("Firebase configuration missing.");
      const { auth } = await getFirebase(firebaseConfig);
      await auth.signOut();
      router.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out.";
      setActionMessage(message);
    }
  };

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const validateTaskFields = ({ title }: { title: string }) => {
    const trimmed = title.trim();
    if (!trimmed) return "Title is required.";
    if (trimmed.length < 3) return "Use at least 3 characters for the title.";
    return null;
  };

  const requestJson = async <T,>(input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const errorMessage =
        typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error?: unknown }).error
          : "Request failed.";
      throw new Error(errorMessage);
    }

    return payload as T;
  };

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const data = await requestJson<{ tasks: Task[] }>("/api/tasks");
      setTasks(data.tasks ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load tasks.";
      showToast({ tone: "error", title: "Unable to load tasks", description: message });
    } finally {
      setIsLoadingTasks(false);
    }
  }, [showToast]);

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateTaskFields({ title: newTask.title });
    if (validationError) {
      setNewTaskError(validationError);
      showToast({ tone: "error", title: "Please check the form", description: validationError });
      return;
    }

    const creationStatus = newTask.status === "done" ? "todo" : newTask.status;
    const adjustedDescription =
      newTask.status === "done"
        ? "New tasks start as pending. We saved this one to your to-do list."
        : "The new task was created.";

    try {
      const data = await requestJson<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTask.title.trim(),
          status: creationStatus,
          priority: newTask.priority,
        }),
      });

      setTasks((prev) => [data.task, ...prev]);
      setNewTask({ title: "", status: "todo", priority: "Medium" });
      setNewTaskError(null);
      showToast({ tone: "success", title: "Task added", description: adjustedDescription });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the task.";
      setNewTaskError(message);
      showToast({ tone: "error", title: "Unable to create task", description: message });
    }
  };

  const handleAdvance = async (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const nextStatus = task.status === "todo" ? "doing" : task.status === "doing" ? "done" : null;
    if (!nextStatus) return;

    try {
      await requestJson("/api/tasks", { method: "PATCH", body: JSON.stringify({ id, status: nextStatus }) });
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
      showToast({ tone: "success", title: "Task updated", description: "Status advanced." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to advance the task.";
      showToast({ tone: "error", title: "Unable to advance task", description: message });
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await requestJson("/api/tasks", { method: "PATCH", body: JSON.stringify({ id, status: "done" }) });
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: "done" } : task)));
      if (editingTaskId === id) {
        setEditingTaskId(null);
        setEditDraft(null);
        setEditError(null);
      }
      showToast({ tone: "success", title: "Task completed", description: "Marked as done." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete the task.";
      showToast({ tone: "error", title: "Unable to complete task", description: message });
    }
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditDraft({ title: task.title, status: task.status, priority: task.priority });
    setEditError(null);
  };

  const handleUpdateTask = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    if (!editDraft) return;
    const validationError = validateTaskFields({ title: editDraft.title });
    if (validationError) {
      setEditError(validationError);
      showToast({ tone: "error", title: "Update blocked", description: validationError });
      return;
    }

    try {
      await requestJson("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id, ...editDraft, title: editDraft.title.trim() }),
      });

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, ...editDraft, title: editDraft.title.trim() } : task)),
      );
      setEditingTaskId(null);
      setEditDraft(null);
      setEditError(null);
      showToast({ tone: "success", title: "Task updated", description: "Changes saved." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the task.";
      setEditError(message);
      showToast({ tone: "error", title: "Unable to update task", description: message });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await requestJson("/api/tasks", { method: "DELETE", body: JSON.stringify({ id }) });
      setTasks((prev) => prev.filter((task) => task.id !== id));
      if (editingTaskId === id) {
        setEditingTaskId(null);
        setEditDraft(null);
        setEditError(null);
      }
      showToast({ tone: "info", title: "Task removed", description: "The task has been deleted." });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the task.";
      showToast({ tone: "error", title: "Unable to delete task", description: message });
      return false;
    }
  };

  const requestDeleteTask = (task: Task) => {
    setPendingDelete(task);
  };

  const cancelDeleteTask = () => setPendingDelete(null);

  const confirmDeleteTask = async () => {
    if (!pendingDelete) return;
    const success = await handleDeleteTask(pendingDelete.id);
    if (success) setPendingDelete(null);
  };

  const readyUser = authState.phase === "ready" ? authState.user : undefined;
  const groupedTasks = tasks.reduce<Record<Task["status"], Task[]>>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    { todo: [], doing: [], done: [] },
  );

  const orderedTasks = useMemo(() => {
    const statusOrder: Task["status"][] = ["todo", "doing", "done"];
    return [...tasks].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  }, [tasks]);

  const renderTaskCard = (task: Task) => (
    <article key={task.id} className="rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-[#dbe8e6]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0f2b2a]">{task.title}</p>
          <p className="text-xs text-[#2f5653]">{task.status === "todo" ? "Queued" : task.status === "doing" ? "In motion" : "Completed"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[#ecf7f4] px-3 py-1 text-xs font-semibold text-[#2f5653]">{task.priority}</span>
          {viewMode === "list" && (
            <span className="rounded-full bg-[#f6fbf9] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f5653] ring-1 ring-[#d6ece8]">
              {task.status === "todo" ? "To do" : task.status === "doing" ? "In progress" : "Done"}
            </span>
          )}
        </div>
      </div>

      {editingTaskId === task.id && editDraft ? (
        <form className="mt-3 space-y-3 rounded-xl bg-[#f6fbf9] p-3 ring-1 ring-[#dbe8e6]" onSubmit={(event) => handleUpdateTask(event, task.id)}>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Title</label>
            <input
              className="w-full rounded-lg border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
              value={editDraft.title}
              onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Status</label>
              <select
                className="w-full rounded-lg border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                value={editDraft.status}
                onChange={(event) =>
                  setEditDraft((prev) => prev ? { ...prev, status: event.target.value as Task["status"] } : prev)
                }
              >
                <option value="todo">To do</option>
                <option value="doing">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Priority</label>
              <select
                className="w-full rounded-lg border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                value={editDraft.priority}
                onChange={(event) =>
                  setEditDraft((prev) => prev ? { ...prev, priority: event.target.value as Task["priority"] } : prev)
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          {editError && <p className="text-xs text-[#c0392b]">{editError}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2ec4b6] px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Save changes
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d6ece8] px-3 py-2 text-xs font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
              onClick={() => {
                setEditingTaskId(null);
                setEditDraft(null);
                setEditError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.status !== "done" && (
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d6ece8] px-3 py-2 text-xs font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
              onClick={() => handleAdvance(task.id)}
            >
              Move to {task.status === "todo" ? "In progress" : "Done"}
            </button>
          )}
          {task.status !== "done" && (
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2ec4b6]/10 px-3 py-2 text-xs font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm ring-1 ring-[#b9e8e1]"
              onClick={() => handleMarkComplete(task.id)}
            >
              Mark as completed
            </button>
          )}
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d6ece8] px-3 py-2 text-xs font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
            onClick={() => handleEditStart(task)}
          >
            Edit
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#f8e1de] px-3 py-2 text-xs font-semibold text-[#8b1a1a] transition hover:-translate-y-0.5 hover:shadow-sm"
            onClick={() => requestDeleteTask(task)}
          >
            Delete
          </button>
          {task.status === "done" && <p className="w-full text-xs text-[#2f5653]">Completed and ready to report.</p>}
        </div>
      )}
    </article>
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
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-[#2f5653]">Today</p>
              <h2 className="text-2xl font-semibold text-[#0f2b2a]">Make a move and ship</h2>
              <p className="text-sm text-[#2f5653]">Advance tasks column by column. Everything here is your focused queue.</p>
            </div>
            <form
              className="flex w-full flex-col gap-3 rounded-2xl bg-[#f6fbf9] p-4 ring-1 ring-[#dbe8e6] sm:max-w-md"
              onSubmit={handleAddTask}
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Title</label>
                <input
                  className="w-full rounded-xl border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                  placeholder="Add a concise task title"
                  value={newTask.title}
                  onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
                />
                {newTaskError && <p className="text-xs text-[#c0392b]">{newTaskError}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Status</label>
                  <select
                    className="w-full rounded-xl border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                    value={newTask.status}
                    onChange={(event) =>
                      setNewTask((prev) => ({ ...prev, status: event.target.value as Task["status"] }))
                    }
                  >
                    <option value="todo">To do</option>
                    <option value="doing">In progress</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5653]">Priority</label>
                  <select
                    className="w-full rounded-xl border border-[#d6ece8] bg-white px-3 py-2 text-sm text-[#0f2b2a] shadow-sm focus:border-[#2ec4b6] focus:outline-none"
                    value={newTask.priority}
                    onChange={(event) =>
                      setNewTask((prev) => ({ ...prev, priority: event.target.value as Task["priority"] }))
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2ec4b6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!newTask.title.trim()}
                >
                  Add task
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#d6ece8] px-4 py-2 text-sm font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
                  onClick={() => {
                    setNewTask({ title: "", status: "todo", priority: "Medium" });
                    setNewTaskError(null);
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <div className="rounded-full bg-[#f6fbf9] p-1 ring-1 ring-[#dbe8e6]">
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${viewMode === "grid" ? "bg-white text-[#0f2b2a] shadow-sm" : "text-[#2f5653]"}`}
                onClick={() => setViewMode("grid")}
              >
                Grid view
              </button>
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${viewMode === "list" ? "bg-white text-[#0f2b2a] shadow-sm" : "text-[#2f5653]"}`}
                onClick={() => setViewMode("list")}
              >
                List view
              </button>
            </div>
          </div>

          {isLoadingTasks ? (
            <div className="mt-4 rounded-2xl bg-[#f6fbf9] px-4 py-3 text-sm text-[#2f5653] ring-1 ring-[#dbe8e6]">
              Loading tasks…
            </div>
          ) : viewMode === "grid" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
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
                    {groupedTasks[key].map((task) => renderTaskCard(task))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orderedTasks.length === 0 && (
                <p className="rounded-xl bg-[#f6fbf9] px-4 py-3 text-sm text-[#2f5653] ring-1 ring-dashed ring-[#cde9e0]">
                  No tasks yet. Add a few to see them here.
                </p>
              )}
              {orderedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl bg-[#f6fbf9] p-3 ring-1 ring-[#dbe8e6]">
                  {renderTaskCard(task)}
                </div>
              ))}
            </div>
          )}
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

        {toasts.length > 0 && (
          <div className="fixed bottom-6 right-6 flex max-w-xs flex-col gap-3 sm:max-w-sm">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`rounded-2xl px-4 py-3 text-sm shadow-[0_15px_40px_rgba(10,41,38,0.14)] ring-1 ${
                  toast.tone === "success"
                    ? "bg-[#e9fbf6] ring-[#b7f0e1] text-[#0f2b2a]"
                    : toast.tone === "error"
                      ? "bg-[#fdecea] ring-[#f4b8b3] text-[#7f1d1d]"
                      : "bg-[#eef6ff] ring-[#c5ddff] text-[#0b2747]"
                }`}
              >
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-1 text-xs opacity-90">{toast.description}</p>}
              </div>
            ))}
          </div>
        )}

        {pendingDelete && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#0f2b2a] shadow-[0_24px_80px_rgba(10,41,38,0.22)] ring-1 ring-[#dbe8e6]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#2f5653]">Confirm deletion</p>
              <h3 className="mt-2 text-xl font-semibold">Remove this task?</h3>
              <p className="mt-2 text-sm text-[#2f5653]">
                &ldquo;{pendingDelete.title}&rdquo; will be permanently removed from your workspace. This cannot be undone.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#f8e1de] px-4 py-2 text-sm font-semibold text-[#8b1a1a] transition hover:-translate-y-0.5 hover:shadow-sm"
                  onClick={confirmDeleteTask}
                >
                  Delete task
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d6ece8] px-4 py-2 text-sm font-semibold text-[#0f2b2a] transition hover:-translate-y-0.5 hover:shadow-sm"
                  onClick={cancelDeleteTask}
                >
                  Keep task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
