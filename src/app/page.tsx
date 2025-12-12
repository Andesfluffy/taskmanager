const palette = {
  lilac500: "#816e91",
  lilac300: "#b4a8bd",
  lilac800: "#342c3a",
  dusty400: "#a2909d",
  dusty200: "#d1c7ce",
  dusty800: "#382e35",
  granite100: "#e3e8e7",
  granite400: "#8ea4a0",
  granite900: "#171c1b",
  slate400: "#79b9b3",
};

const featureCards = [
  {
    title: "Plan with confidence",
    description:
      "Prioritize projects, set milestones, and lock in deadlines with clear ownership so nothing slips.",
    accent: palette.lilac500,
  },
  {
    title: "Automate the busywork",
    description:
      "Recurring workflows, smart reminders, and status digests keep your team in sync without chasing updates.",
    accent: palette.slate400,
  },
  {
    title: "Stay aligned",
    description:
      "Share roadmaps, approvals, and decisions in one place with branded notes and stakeholder read receipts.",
    accent: palette.dusty400,
  },
];

const perks = [
  "AI summaries that surface blockers in seconds",
  "Kanban, calendar, and workload views built in",
  "Branded client portals with live progress",
  "Enterprise-grade permissions and audit trails",
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#f2f0f4,transparent_30%),radial-gradient(circle_at_80%_10%,#eef6f6,transparent_28%),radial-gradient(circle_at_60%_70%,#f3f1f3,transparent_32%)] text-[#171c1b]">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-[#e6e2e9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl" style={{ background: palette.lilac500 }} />
            <div className="leading-tight">
              <p className="text-xs uppercase tracking-[0.2em] text-[#534650]">Omnick</p>
              <p className="text-lg font-semibold text-[#342c3a]">Task Manager</p>
            </div>
          </div>
          <div className="hidden gap-6 text-sm font-medium text-[#4e4257] md:flex">
            <a className="hover:text-[#342c3a]" href="#features">Features</a>
            <a className="hover:text-[#342c3a]" href="#workflow">Workflow</a>
            <a className="hover:text-[#342c3a]" href="#brand">Brand kit</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-[#cdc5d3] px-4 py-2 text-sm font-semibold text-[#4e4257] transition hover:-translate-y-0.5 hover:border-[#816e91] md:inline-flex">
              Live demo
            </button>
            <button
              className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(52,44,58,0.18)] transition hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${palette.lilac500}, ${palette.slate400})` }}
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16 md:py-24">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#534650] shadow-sm ring-1 ring-[#e6e2e9]">
              Crafted for modern teams
              <span className="h-2 w-2 rounded-full" style={{ background: palette.slate400 }} />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.1] text-[#1a161d] md:text-5xl">
                Build a task manager with real craftsmanship and a brand your clients remember.
              </h1>
              <p className="max-w-2xl text-lg text-[#534650]">
                Omnick blends thoughtful planning, automation, and beautiful reporting so your team can deliver with clarity
                and calm. Design a landing page that feels premium from day one.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: palette.lilac800 }}
              >
                Start your workspace
              </button>
              <button className="rounded-full border border-[#cdc5d3] bg-white px-6 py-3 text-sm font-semibold text-[#342c3a] transition hover:-translate-y-0.5 hover:border-[#816e91]">
                View pricing
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map((perk) => (
                <div key={perk} className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-[#e6e2e9]">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: palette.slate400 }}>
                    ✓
                  </span>
                  <p className="text-sm text-[#382e35]">{perk}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-white/90 p-6 shadow-[0_20px_80px_rgba(26,22,29,0.08)] ring-1 ring-[#e6e2e9]">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, rgba(129,110,145,0.15), transparent 35%), radial-gradient(circle at 80% 10%, rgba(88,167,160,0.15), transparent 32%), radial-gradient(circle at 60% 80%, rgba(58, 44, 58, 0.1), transparent 40%)",
              }}
            />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Active projects</p>
                  <p className="text-2xl font-semibold text-[#1a161d]">Q3 launch calendar</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: palette.slate400 }}>
                  On track
                </span>
              </div>
              <div className="grid gap-3 text-sm text-[#342c3a]">
                {["Experience revamp", "Mobile edge", "Performance uplift", "Client onboarding"]
                  .map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-[#e6e2e9]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl" style={{ background: idx % 2 === 0 ? palette.dusty200 : palette.granite100 }} />
                        <div>
                          <p className="font-semibold text-[#1a161d]">{item}</p>
                          <p className="text-xs text-[#6f5d6a]">Owner • Due in {10 + idx * 4} days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-[#f2f0f4]">
                          <div
                            className="h-full"
                            style={{ width: `${60 + idx * 10}%`, background: idx % 2 === 0 ? palette.lilac500 : palette.slate400 }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#534650]">{60 + idx * 10}%</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="rounded-2xl bg-[#f2f0f4]/80 p-4 text-sm text-[#382e35] ring-1 ring-[#e6e2e9]">
                <p className="font-semibold text-[#1a161d]">Weekly digest</p>
                <p className="mt-1 text-[#4e4257]">
                  Dependencies cleared for onboarding stream. Two blockers flagged for the mobile edge crew — ETA tomorrow.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-6 rounded-[32px] bg-white/80 p-8 shadow-[0_14px_50px_rgba(26,22,29,0.06)] ring-1 ring-[#e6e2e9]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Why Omnick</p>
              <h2 className="text-3xl font-semibold text-[#1a161d]">A landing page that sells the workflow</h2>
              <p className="max-w-2xl text-[#534650]">
                Showcase the product story with confident typography, bespoke color blocking, and screenshots that feel crafted.
                Every section below is built from the palette you shared for a consistent brand language.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#342c3a] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
              Download brand kit
              <span className="text-base">↗</span>
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(26,22,29,0.05)] ring-1 ring-[#e6e2e9]"
              >
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-2xl" style={{ background: card.accent }} />
                  <h3 className="text-lg font-semibold text-[#1a161d]">{card.title}</h3>
                </div>
                <p className="mt-4 text-sm text-[#534650]">{card.description}</p>
                <a className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4e4257]" href="#">
                  See details <span className="text-base">→</span>
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="grid gap-10 rounded-[32px] bg-[#f2f0f4]/70 p-8 ring-1 ring-[#e6e2e9] md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Workflow preview</p>
            <h3 className="text-3xl font-semibold text-[#1a161d]">How your landing page guides the story</h3>
            <p className="text-[#534650]">
              Use layered sections to introduce the brand, spotlight automation, and reassure clients with transparent delivery.
              Pair hero messaging with proof points, show the dashboard, then end with a polished call-to-action.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Hero + proof", "Workflow highlights", "Testimonials", "CTA"]
                .map((item) => (
                  <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#342c3a] shadow-sm ring-1 ring-[#e6e2e9]">
                    {item}
                  </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#382e35]">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-[#e6e2e9]">
                <span className="h-2 w-2 rounded-full" style={{ background: palette.lilac500 }} />
                Typography: Work Sans + tight tracking
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-[#e6e2e9]">
                <span className="h-2 w-2 rounded-full" style={{ background: palette.dusty400 }} />
                Card radius: 24-32px
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-[#e6e2e9]">
                <span className="h-2 w-2 rounded-full" style={{ background: palette.slate400 }} />
                Gradient accents + soft noise
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_16px_60px_rgba(26,22,29,0.07)] ring-1 ring-[#e6e2e9]">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(129,110,145,0.12), rgba(88,167,160,0.12))` }} />
            <div className="relative space-y-4 text-sm text-[#342c3a]">
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-[#e6e2e9]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Step 1</p>
                  <p className="font-semibold text-[#1a161d]">Lead captures</p>
                </div>
                <span className="rounded-full bg-[#f1f4f3] px-3 py-1 text-xs font-semibold text-[#445552]">+38% conversion</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-[#e6e2e9]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Step 2</p>
                  <p className="font-semibold text-[#1a161d]">Automated onboarding</p>
                </div>
                <span className="rounded-full bg-[#eef6f6] px-3 py-1 text-xs font-semibold text-[#356460]">Playbooks</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-[#e6e2e9]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Step 3</p>
                  <p className="font-semibold text-[#1a161d]">Transparent delivery</p>
                </div>
                <span className="rounded-full bg-[#f2f0f4] px-3 py-1 text-xs font-semibold text-[#4e4257]">Client portal</span>
              </div>
              <div className="rounded-2xl bg-[#1a161d] px-5 py-4 text-white shadow-lg">
                <p className="text-sm font-semibold">CTA block</p>
                <p className="text-xs text-white/80">Invite visitors to book a demo or start a workspace in seconds.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="brand" className="grid gap-8 rounded-[32px] bg-white/80 p-8 shadow-[0_14px_50px_rgba(26,22,29,0.06)] ring-1 ring-[#e6e2e9] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Branding</p>
            <h3 className="text-3xl font-semibold text-[#1a161d]">Color system ready to hand off</h3>
            <p className="text-[#534650]">
              The palette blends lilac ash, dusty lavender, and granite neutrals with a calming slate accent. Use them across
              buttons, backgrounds, and cards for a cohesive identity.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[palette.lilac500, palette.dusty400, palette.granite400, palette.slate400].map((color) => (
                <div key={color} className="flex items-center justify-between rounded-2xl border border-[#e6e2e9] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-12 w-12 rounded-xl" style={{ background: color }} />
                    <div className="text-sm font-semibold text-[#342c3a]">{color.toUpperCase()}</div>
                  </div>
                  <span className="rounded-full bg-[#f3f1f3] px-3 py-1 text-xs font-semibold text-[#4e4257]">Primary tone</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] bg-[#f2f0f4]/70 p-6 ring-1 ring-[#e6e2e9]">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 text-sm text-[#342c3a] shadow-sm ring-1 ring-[#e6e2e9]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Typography</p>
                <p className="mt-2 font-semibold">Geist Sans</p>
                <p className="text-[#534650]">Headline weight 600, body 400-500.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-[#342c3a] shadow-sm ring-1 ring-[#e6e2e9]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Components</p>
                <p className="mt-2 font-semibold">Rounded corners</p>
                <p className="text-[#534650]">Use 24-32px radius and soft inner shadows.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-[#342c3a] shadow-sm ring-1 ring-[#e6e2e9]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Spacing</p>
                <p className="mt-2 font-semibold">8px grid</p>
                <p className="text-[#534650]">Comfortable breathing room to feel premium.</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-[#342c3a] shadow-sm ring-1 ring-[#e6e2e9]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6f5d6a]">Imagery</p>
                <p className="mt-2 font-semibold">Hands-on craft</p>
                <p className="text-[#534650]">Pair product shots with human, tactile details.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e2e9] bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-[#534650] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl" style={{ background: palette.lilac500 }} />
            <p className="font-semibold text-[#1a161d]">Omnick</p>
          </div>
          <p>Built for teams who care about the craft of delivery.</p>
          <div className="flex gap-4 font-semibold text-[#4e4257]">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
