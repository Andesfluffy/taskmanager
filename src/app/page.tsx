"use client";

import { useEffect, useMemo, useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

const statusOptions = [
  "Backlog",
  "In Progress",
  "Blocked",
  "Ready",
  "Done",
] as const;

type TaskStatus = (typeof statusOptions)[number];
type TaskPriority = "Low" | "Medium" | "High";

type ToastVariant = "success" | "info" | "warning" | "error";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface Confirmation {
  id: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const demoTasks: Task[] = [
  {
    id: "1",
    title: "Set up project workspace",
    description: "Align environments, install dependencies, and prepare CI.",
    status: "Ready",
    priority: "High",
    dueDate: new Date().toISOString().slice(0, 10),
  },
  {
    id: "2",
    title: "Design task detail view",
    description: "Capture CRUD flows, validation, and audit needs.",
    status: "In Progress",
    priority: "Medium",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  },
  {
    id: "3",
    title: "Refine backlog triage",
    description: "Agree on definition of ready and attach owners.",
    status: "Backlog",
    priority: "Low",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
  },
];

function badgeStyles(status: TaskStatus) {
  switch (status) {
    case "Backlog":
      return "bg-slate-100 text-slate-700";
    case "In Progress":
      return "bg-blue-100 text-blue-700";
    case "Blocked":
      return "bg-amber-100 text-amber-800";
    case "Ready":
      return "bg-emerald-100 text-emerald-700";
    case "Done":
      return "bg-gray-100 text-gray-700";
  }
}

function priorityStyles(priority: TaskPriority) {
  switch (priority) {
    case "Low":
      return "text-emerald-700 bg-emerald-50";
    case "Medium":
      return "text-blue-700 bg-blue-50";
    case "High":
      return "text-rose-700 bg-rose-50";
  }
}

function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const base =
    "shadow-lg rounded-lg border px-4 py-3 text-sm flex items-center gap-2";

  const variantClass: Record<ToastVariant, string> = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    info: "bg-sky-50 border-sky-200 text-sky-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
  };

  const icon: Record<ToastVariant, string> = {
    success: "✓",
    info: "ℹ",
    warning: "!",
    error: "✕",
  };

  return (
    <div className={`${base} ${variantClass[toast.variant]}`}>
      <span className="font-semibold">{icon[toast.variant]}</span>
      <p className="flex-1 leading-tight">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-xs font-semibold uppercase tracking-wide"
      >
        Close
      </button>
    </div>
  );
}

function ToastRegion({
  toasts,
  dismiss,
}: {
  toasts: ToastMessage[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={dismiss} />
      ))}
    </div>
  );
}

function ConfirmationModal({
  confirmation,
  onCancel,
}: {
  confirmation: Confirmation | null;
  onCancel: () => void;
}) {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900">
          {confirmation.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{confirmation.body}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              confirmation.onConfirm();
              onCancel();
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return demoTasks;
    const saved = window.localStorage.getItem("task-manager:data");
    return saved ? JSON.parse(saved) : demoTasks;
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "Ready",
    priority: "Medium",
    dueDate: new Date().toISOString().slice(0, 10),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    window.localStorage.setItem("task-manager:data", JSON.stringify(tasks));
  }, [tasks]);

  const addToast = (message: string, variant: ToastVariant = "info") => {
    setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), message, variant },
    ]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) =>
        statusFilter === "All" ? true : task.status === statusFilter,
      )
      .filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, search, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "Done").length;
    const inFlight = tasks.filter((task) => task.status === "In Progress").length;
    const blocked = tasks.filter((task) => task.status === "Blocked").length;
    return { total, done, inFlight, blocked };
  }, [tasks]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "Ready",
      priority: "Medium",
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.title?.trim()) {
      addToast("Title is required to create a task", "warning");
      return;
    }
    if (!formData.dueDate) {
      addToast("Please set a due date", "warning");
      return;
    }

    if (editingId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingId ? ({ ...task, ...formData } as Task) : task,
        ),
      );
      addToast("Task updated successfully", "success");
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: formData.title!,
        description: formData.description?.trim() || "No description provided",
        status: (formData.status as TaskStatus) || "Ready",
        priority: (formData.priority as TaskPriority) || "Medium",
        dueDate: formData.dueDate,
      };
      setTasks((prev) => [...prev, newTask]);
      addToast("Task created", "success");
    }
    resetForm();
  };

  const queueDelete = (task: Task) => {
    setConfirmation({
      id: task.id,
      title: "Delete task?",
      body: `This will permanently remove “${task.title}” and its activity.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
        addToast("Task deleted", "info");
      },
    });
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({ ...task });
  };

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );
    addToast(`Status set to ${status}`, "success");
  };

  const handlePriorityChange = (task: Task, priority: TaskPriority) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, priority } : item)),
    );
    addToast(`Priority set to ${priority}`, "info");
  };

  const resetDemo = () => {
    setTasks(demoTasks);
    addToast("Restored demo tasks", "info");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900">
      <ToastRegion toasts={toasts} dismiss={dismissToast} />
      <ConfirmationModal
        confirmation={confirmation}
        onCancel={() => setConfirmation(null)}
      />
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">Task Manager</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              High-trust, high-clarity workboard
            </h1>
            <p className="text-sm text-gray-600">
              CRUD-first experience with confirmations, toasts, and live status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetDemo}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Open work</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Including planned and active</p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">In progress</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.inFlight}</p>
            <p className="text-xs text-gray-500">Shipping now</p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Blocked</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{stats.blocked}</p>
            <p className="text-xs text-gray-500">Needs escalation</p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.done}</p>
            <p className="text-xs text-gray-500">Marked done</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-sky-700">{editingId ? "Update task" : "Create task"}</p>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit task details" : "Add a new task"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {editingId
                      ? "Save edits with validation and live persistence."
                      : "Capture the work with required metadata."}
                  </p>
                </div>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-sm font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
                    placeholder="Summarize the task"
                    required
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
                    placeholder="What does success look like?"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: event.target.value as TaskStatus,
                        }))
                      }
                      className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700" htmlFor="priority">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: event.target.value as TaskPriority,
                        }))
                      }
                      className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
                    >
                      {(["Low", "Medium", "High"] as TaskPriority[]).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="dueDate">
                    Due date
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                  >
                    {editingId ? "Save changes" : "Create task"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-sky-700">Tasks</p>
                  <h2 className="text-xl font-semibold text-gray-900">Backlog and active</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <span className="text-gray-400">🔎</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by title or description"
                      className="w-full bg-transparent text-gray-700 outline-none"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as TaskStatus | "All")
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm"
                  >
                    <option value="All">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {filteredTasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                    No tasks match your filters. Create a task to get started.
                  </p>
                )}
                {filteredTasks.map((task) => (
                  <article
                    key={task.id}
                    className="group rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles(task.priority)}`}>
                            {task.priority} priority
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            Due {task.dueDate}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <p className="max-w-3xl text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:items-end">
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              handleStatusChange(task, event.target.value as TaskStatus)
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <select
                            value={task.priority}
                            onChange={(event) =>
                              handlePriorityChange(
                                task,
                                event.target.value as TaskPriority,
                              )
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm"
                          >
                            {(["Low", "Medium", "High"] as TaskPriority[]).map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 text-sm font-medium">
                          <button
                            onClick={() => startEdit(task)}
                            className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => queueDelete(task)}
                            className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
