"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Monitor from "@/components/Monitor";

/* ---- Slide components ---- */

function SlideTitle() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center bg-[#c6c6c6]">
      <div className="w95 px-8 py-5 inline-block">
        <div className="font-pixel text-[14px] md:text-[20px] text-[#0000a8] leading-loose tracking-wide">
          OFFICE<br />OF<br />SUSPICION
        </div>
      </div>
      <div className="font-pixel text-[8px] text-gray-500 tracking-widest">
        NEW HIRE ORIENTATION — v2.0
      </div>
      <div className="memo max-w-sm text-left">
        <div className="font-retro text-xl text-gray-700 leading-snug">
          Someone in the company is cooking the books.
          It's your job to find them — or cover your tracks.
        </div>
      </div>
      <div className="font-pixel text-[7px] text-gray-400 animate-blink">
        PRESS NEXT TO BEGIN ›
      </div>
    </div>
  );
}

function SlideTeams() {
  return (
    <div className="h-full overflow-y-auto scroll95 p-4 bg-[#c6c6c6] space-y-4">
      <div className="memo">
        <div className="memo-head">
          <span className="font-pixel text-[9px] text-gray-600">INTERNAL MEMO</span>
          <span className="memo-confidential">CONFIDENTIAL</span>
        </div>
        <div className="memo-divider" />
        <p className="memo-brief">
          At the start of each game, every player is secretly assigned to one of two teams.
          Nobody knows who's who — except the Fraudsters, who know each other from the start.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="w95">
          <div className="w95-title" style={{ background: "#0a3d1f" }}>
            <span>✔ THE STAFF</span>
          </div>
          <div className="p-3 bg-[#e2f2e6] font-retro text-base text-[#0a3d1f] space-y-1">
            <p>Accountant</p>
            <p>Auditor</p>
            <p>Controller</p>
            <div className="border-t border-green-300 mt-2 pt-2 text-gray-600 text-sm font-retro">
              Identify and fire all fraudsters.
            </div>
          </div>
        </div>
        <div className="w95">
          <div className="w95-title" style={{ background: "#3d0a0a" }}>
            <span>✘ FRAUDSTERS</span>
          </div>
          <div className="p-3 bg-[#fbe2e3] font-retro text-base text-[#a4161a] space-y-1">
            <p>Hidden team</p>
            <p>Know each other</p>
            <p>Blend in as staff</p>
            <div className="border-t border-red-300 mt-2 pt-2 text-gray-600 text-sm font-retro">
              Outnumber remaining staff.
            </div>
          </div>
        </div>
      </div>

      <div className="action-panel">
        <div className="action-title">KEY RULE</div>
        <div className="font-retro text-base text-gray-700">
          Roles are never openly announced. Only game events — audit results, budget surplus,
          or the final report — reveal them.
        </div>
      </div>
    </div>
  );
}

function SlideRoles() {
  const roles = [
    {
      name: "ACCOUNTANT",
      sub: "Most players",
      bg: "#0000a8",
      items: [
        { phase: "☾ NIGHT", text: "Solve invoice math tasks as a team. Hit the quota to earn a Budget Surplus — if someone was eliminated that night, their role is revealed in the log." },
        { phase: "☀ DAY", text: "Discuss with everyone and cast your vote to fire a suspect." },
      ],
    },
    {
      name: "AUDITOR",
      sub: "5+ players",
      bg: "#1d6b35",
      items: [
        { phase: "☾ NIGHT", text: "Secretly investigate one player. You privately see if they're a FRAUDSTER — or their exact role (Accountant, Controller…)." },
        { phase: "☀ DAY", text: "Use your intel to steer the vote — without giving yourself away." },
      ],
    },
    {
      name: "CONTROLLER",
      sub: "6+ players",
      bg: "#6b4a00",
      items: [
        { phase: "☾ NIGHT", text: "Protect one player from elimination. If fraudsters target them, they survive." },
        { phase: "☀ DAY", text: "Vote like everyone else. Who you protected is shown in the morning log." },
      ],
    },
    {
      name: "FRAUDSTER",
      sub: "2–3 per game",
      bg: "#a4161a",
      items: [
        { phase: "☾ NIGHT", text: "Secretly vote with your partner(s) to eliminate one staff member. Plurality wins — a tied vote means no one is eliminated." },
        { phase: "☀ DAY", text: "Blend in. Deflect suspicion. Frame innocent staff members." },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto scroll95 p-3 bg-[#c6c6c6]">
      <div className="font-pixel text-[8px] text-gray-500 mb-3">HR_RECORDS.EXE — STAFF ROLES</div>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => (
          <div key={r.name} className="w95">
            <div className="w95-title" style={{ background: r.bg }}>
              <span>{r.name}</span>
              <span className="font-retro text-[11px] opacity-70">{r.sub}</span>
            </div>
            <div className="p-2 bg-[#f1efe6] space-y-2">
              {r.items.map((item, i) => (
                <div key={i}>
                  <div className="font-pixel text-[7px] text-gray-500 mb-0.5">{item.phase}</div>
                  <div className="font-retro text-sm text-gray-700 leading-tight">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideNight() {
  return (
    <div className="h-full flex flex-col p-3 bg-[#c6c6c6]">
      <div className="font-pixel text-[8px] text-gray-500 mb-2">PHASE 1 — NIGHT (30 SECONDS)</div>
      <div className="terminal95 flex-1 overflow-y-auto scroll95">
        <p className="term-boot">&gt; NIGHT_SHIFT.EXE INITIALIZED</p>
        <p className="term-boot">&gt; VOICE CHANNELS: DISABLED</p>
        <br />
        <p className="term-ts">[FRAUDSTERS]</p>
        <p className="term-arrow">  → Vote on a target. Plurality wins — ties result in no elimination.</p>
        <p className="term-arrow">  → Target survives if the Controller shielded them.</p>
        <br />
        <p className="term-ts">[AUDITOR]</p>
        <p className="term-arrow">  → Investigate one player.</p>
        <p className="term-arrow">  → If fraudster: you see FRAUDSTER. If not: you see their exact role.</p>
        <p className="term-arrow">  → Result is private — only you see it.</p>
        <br />
        <p className="term-ts">[CONTROLLER]</p>
        <p className="term-arrow">  → Choose one player to shield from elimination.</p>
        <br />
        <p className="term-ts">[ACCOUNTANTS]</p>
        <p className="term-arrow">  → Solve invoice tasks as a team.</p>
        <p className="term-arrow">  → Hit the quota = BUDGET SURPLUS achieved.</p>
        <p className="term-arrow">  → If someone was eliminated, their role is revealed in the log.</p>
        <br />
        <p className="text-[#ffb000]">&gt; PHASE ENDS WHEN ALL ACTIONS SUBMITTED OR TIMER EXPIRES</p>
        <p className="term-cursor95">_</p>
      </div>
    </div>
  );
}

function SlideDay() {
  const steps = [
    {
      n: "01",
      title: "READ THE SECURITY LOG",
      text: "Night results are posted. See who was eliminated. If a Budget Surplus was earned, their role is also revealed.",
    },
    {
      n: "02",
      title: "OPEN DISCUSSION",
      text: "Discuss with the group. Accuse suspects, share what you know, or lay low. Fraudsters will try to misdirect you.",
    },
    {
      n: "03",
      title: "TERMINATION VOTE",
      text: "Vote to fire one person. Plurality wins — ties mean no one is fired. The eliminated player's role is always revealed in the log.",
    },
    {
      n: "04",
      title: "NEXT NIGHT",
      text: "The host manually starts the next Night phase. Rounds continue until one team wins.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto scroll95 p-3 bg-[#c6c6c6] space-y-2">
      <div className="font-pixel text-[8px] text-gray-500 mb-1">PHASE 2 — MORNING MEETING (1 MIN 30 SEC)</div>
      {steps.map((s) => (
        <div key={s.n} className="action-panel flex gap-3 items-start">
          <span className="font-pixel text-[9px] text-[#0000a8] mt-0.5 shrink-0">{s.n}</span>
          <div>
            <div className="action-title">{s.title}</div>
            <div className="font-retro text-base text-gray-700">{s.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SlideWin() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 bg-[#c6c6c6] gap-4">
      <div className="font-pixel text-[8px] text-gray-500 tracking-widest">WIN CONDITIONS</div>
      <div className="w-full max-w-md space-y-3">
        <div className="w95">
          <div className="w95-title" style={{ background: "#0a3d1f" }}>
            <span>✔ STAFF WIN</span>
          </div>
          <div className="p-4 bg-[#e2f2e6]">
            <div className="font-pixel text-[8px] text-[#0a3d1f] mb-2">ALL FRAUDSTERS ELIMINATED</div>
            <div className="font-retro text-base text-gray-600">
              Fire every fraudster — by day vote or night action — before they reach parity with staff.
            </div>
          </div>
        </div>
        <div className="w95">
          <div className="w95-title" style={{ background: "#3d0a0a" }}>
            <span>✘ FRAUDSTERS WIN</span>
          </div>
          <div className="p-4 bg-[#fbe2e3]">
            <div className="font-pixel text-[8px] text-[#a4161a] mb-2">FRAUDSTERS ≥ REMAINING STAFF</div>
            <div className="font-retro text-base text-gray-600">
              When fraudsters equal or outnumber the remaining staff, the company is compromised.
            </div>
          </div>
        </div>
        <div className="memo text-center">
          <div className="font-retro text-base text-gray-600">
            Win conditions are checked after every elimination — day or night.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Slide config ---- */

const SLIDE_TITLES = [
  "ORIENTATION.EXE",
  "COMPANY_BRIEFING.TXT",
  "HR_RECORDS.EXE",
  "SCHEDULE_NIGHT.LOG",
  "MORNING_MEETING.TXT",
  "VICTORY_CONDITIONS.SYS",
];

const TOTAL = SLIDE_TITLES.length;

/* ---- Main page ---- */

export default function HandbookPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  const next = () => {
    if (slide < TOTAL - 1) setSlide(slide + 1);
    else router.push("/");
  };
  const prev = () => { if (slide > 0) setSlide(slide - 1); };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === " ") e.preventDefault();
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        if (slide < TOTAL - 1) setSlide(slide + 1);
        else router.push("/");
      }
      if (e.key === "ArrowLeft" && slide > 0) setSlide(slide - 1);
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide]);

  function renderSlide() {
    switch (slide) {
      case 0: return <SlideTitle />;
      case 1: return <SlideTeams />;
      case 2: return <SlideRoles />;
      case 3: return <SlideNight />;
      case 4: return <SlideDay />;
      case 5: return <SlideWin />;
      default: return null;
    }
  }

  const isLast = slide === TOTAL - 1;

  return (
    <main className="flex items-center justify-center w-full h-screen p-2 overflow-hidden md:p-4">
      <Monitor>
        <div className="relative w-full h-full os-desktop flex flex-col p-4 md:p-6">
          <div className="crt-scanlines95" />

          <div className="relative z-10 w95 flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Title bar */}
            <div className="w95-title shrink-0">
              <span>{SLIDE_TITLES[slide]}</span>
              <div className="flex gap-1">
                <button className="w95-ctl">—</button>
                <button className="w95-ctl">□</button>
                <button className="w95-ctl" onClick={() => router.push("/")}>×</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderSlide()}
            </div>

            {/* Navigation footer */}
            <div className="shrink-0 border-t border-gray-400 p-2 flex items-center justify-between bg-[#c6c6c6]">
              <button onClick={prev} disabled={slide === 0} className="btn95 px-3 py-1.5">
                ← PREV
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`w-2.5 h-2.5 border border-gray-500 ${
                      i === slide ? "bg-[#0000a8]" : "bg-[#c6c6c6] hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              <button onClick={next} className="btn95 px-3 py-1.5">
                {isLast ? "ENTER OFFICE →" : "NEXT →"}
              </button>
            </div>
          </div>
        </div>
      </Monitor>
    </main>
  );
}
