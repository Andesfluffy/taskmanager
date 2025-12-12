import Link from "next/link";

type Feature = {
  title: string;
  description: string;
  icon: string;
};

const featureList: Feature[] = [
  {
    title: "Authentication",
    description: "Secure sign up, login, and session handling so people can safely access their tasks from anywhere.",
    icon: "🔐",
  },
  {
    title: "Task CRUD",
    description: "Create, edit, complete, and delete tasks with inline validation to keep data clean and actionable.",
    icon: "✅",
  },
  {
    title: "Status workflow",
    description: "Standard statuses (Backlog → In Progress → Done) that keep everyone aligned on progress.",
    icon: "🛤️",
  },
  {
    title: "Search, filter, & sort",
    description: "Fast search plus filters for status, assignee, and date so the right tasks surface instantly.",
    icon: "🔎",
  },
  {
    title: "Due dates & overdue",
    description: "Clear deadlines, reminders, and visual highlighting for items that need immediate attention.",
    icon: "⏰",
  },
  {
    title: "Labels",
    description: "Topic and priority tags that make grouping and reporting effortless across teams.",
    icon: "🏷️",
  },
  {
    title: "Subtasks",
    description: "Break work into manageable steps with completion tracking that rolls up to the parent task.",
    icon: "🪜",
  },
];

const steps = [
  {
    title: "Launch-ready in weeks",
    detail:
      "Ship the core experience that delivers value on day one without getting stuck on nice-to-haves.",
  },
  {
    title: "Focused collaboration",
    detail: "Give teams clarity on ownership, status, and deadlines so nothing slips through the cracks.",
  },
  {
    title: "Prove adoption fast",
    detail: "Measure activation with logins, task creation, and on-time completion before expanding scope.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Task Manager MVP</p>
            <h1 className="text-2xl font-semibold text-zinc-900">Build the perfect first release</h1>
          </div>
          <Link
            href="#features"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            View scope
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
              <span className="text-lg">⚡</span>
              Launch in weeks, not months
            </div>
            <h2 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              A crisp MVP that covers the workflows people actually use every day.
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              Focus on the essentials: secure access, fast task capture, clarity on status, and the signals that drive
              accountability. Ship this scope first to validate adoption before investing in advanced automation.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-zinc-700">
              {["Product teams", "Project managers", "Founders", "Client delivery", "Ops & IT"].map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-zinc-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-zinc-500">MVP Checklist</p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-900">Seven essentials</h3>
              </div>
              <div className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                Start here
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {featureList.map(({ title, description, icon }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-zinc-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-lg text-white">
                    {icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-zinc-900">{title}</p>
                    <p className="text-sm text-zinc-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <span>🎯</span>
              Why this scope
            </header>
            <h3 className="mt-4 text-3xl font-semibold text-zinc-900">Everything teams need to succeed immediately</h3>
            <p className="mt-3 text-lg text-zinc-600">
              Each capability builds confidence for early adopters and gives you clean product signals. Together they
              form a coherent workflow: capture, organize, prioritize, and deliver work with accountability.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-zinc-900/90 p-5 text-white shadow-lg">
                <h4 className="text-lg font-semibold">Trustworthy entry point</h4>
                <p className="mt-2 text-sm text-zinc-100">
                  Authentication anchors your data model and unlocks collaboration. Ship with sessions, reset flows, and
                  role-based permissions for tasks.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h4 className="text-lg font-semibold text-zinc-900">Operational clarity</h4>
                <p className="mt-2 text-sm text-zinc-600">
                  Status workflow plus due dates make ownership visible. Overdue highlighting ensures high-risk items are
                  impossible to ignore.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h4 className="text-lg font-semibold text-zinc-900">Frictionless planning</h4>
                <p className="mt-2 text-sm text-zinc-600">
                  Labels, search, filters, and sort keep the backlog navigable. Subtasks keep big work items organized
                  without overwhelming the main board.
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-zinc-900 via-black to-zinc-800 p-5 text-white shadow-lg">
                <h4 className="text-lg font-semibold">Data you can measure</h4>
                <p className="mt-2 text-sm text-zinc-100">
                  With these primitives you can track creation rates, completion velocity, and overdue counts—metrics
                  that validate product-market fit.
                </p>
              </div>
            </div>
          </article>

          <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <span>🧭</span>
              Path to launch
            </header>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-zinc-900">{step.title}</p>
                    <p className="text-sm text-zinc-600">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-dashed border-zinc-300 bg-gradient-to-br from-white via-zinc-50 to-white p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Next iteration ideas</p>
              <ul className="mt-2 space-y-1 list-disc pl-4">
                <li>Team mentions, file attachments, and notifications</li>
                <li>Calendar view and workload balancing</li>
                <li>API + webhooks for automation</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
