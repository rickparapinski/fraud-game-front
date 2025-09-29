"use client";

const STYLE = {
  fraudster: {
    label: "FRAUDSTER",
    chip: "bg-role-fraudster/20 text-role-fraudster",
    ring: "ring-role-fraudster/30",
    glow: "shadow-[0_0_40px_-10px_rgba(239,68,68,0.35)]",
    gradient: "from-role-fraudster/20 to-transparent",
    icon: "🕶️",
  },
  auditor: {
    label: "AUDITOR",
    chip: "bg-role-auditor/20 text-role-auditor",
    ring: "ring-role-auditor/30",
    glow: "shadow-[0_0_40px_-10px_rgba(139,92,246,0.35)]",
    gradient: "from-role-auditor/20 to-transparent",
    icon: "🔍",
  },
  controller: {
    label: "CONTROLLER",
    chip: "bg-role-controller/20 text-role-controller",
    ring: "ring-role-controller/30",
    glow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.35)]",
    gradient: "from-role-controller/20 to-transparent",
    icon: "🛡️",
  },
  accountant: {
    label: "ACCOUNTANT",
    chip: "bg-role-accountant/20 text-role-accountant",
    ring: "ring-role-accountant/30",
    glow: "shadow-[0_0_40px_-10px_rgba(59,130,246,0.35)]",
    gradient: "from-role-accountant/20 to-transparent",
    icon: "💼",
  },
};

export default function RoleCard({
  role = "accountant",
  instructions,
  teammates = [],
}) {
  const s = STYLE[role] ?? STYLE.accountant;

  const Pill = ({ children }) => (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white/10 hover:bg-white/15">
      {children}
    </span>
  );

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/95 p-5 text-white",
        "ring-1",
        s.ring,
        s.glow,
      ].join(" ")}
    >
      {/* role-tinted wash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.gradient}`}
      />

      {/* header */}
      <header className="relative z-10 flex items-start gap-3">
        <div
          className={`grid place-items-center w-10 h-10 rounded-xl ${s.chip}`}
          aria-hidden
        >
          <span className="text-base">{s.icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold leading-tight">
            Your role:{" "}
            <span className={s.chip.replace("bg-", "text-").replace("/20", "")}>
              {s.label}
            </span>
          </h3>
          {instructions && (
            <p className="mt-2 text-sm text-white/80">{instructions}</p>
          )}
        </div>
      </header>

      {/* teammates (fraudsters) */}
      {role === "fraudster" && teammates.length > 0 && (
        <div className="relative z-10 mt-4">
          <p className="text-sm font-semibold text-white/90 mb-1">
            Your fellow fraudsters:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-white/90">
            {teammates.map((t) => (
              <li key={t.id || t.name}>{t.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* footer actions */}
      <footer className="relative z-10 mt-4 flex flex-wrap gap-2">
        <Pill>Secret</Pill>
        <Pill>Keep this private</Pill>
      </footer>
    </section>
  );
}
