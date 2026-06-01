"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  HardDrive,
  Trash2,
  Network,
  Folder,
  Minus,
  Square,
  X,
  ChevronRight,
  FileText,
  ShieldAlert,
  Calculator,
  Coffee,
  FileType,
  Briefcase,
  Search,
  Shield,
  User,
  Volume2,
  Calendar,
} from "lucide-react";

// --- HELPER: Desktop Icon ---
function DesktopIcon({ icon: Icon, label, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`
        w-20 flex flex-col items-center gap-1 cursor-pointer group p-2 border border-transparent
        ${active ? "bg-blue-800/50 border-dotted border-white/50" : "hover:bg-white/10"}
      `}
    >
      <Icon className="w-8 h-8 text-white drop-shadow-md" />
      <span
        className={`
        text-xs text-white text-center leading-tight drop-shadow-md px-1
        ${active ? "bg-blue-800" : ""}
      `}
      >
        {label}
      </span>
    </div>
  );
}

// --- HELPER: Windows 95 Window Frame ---
function Win95Window({
  title,
  icon,
  menu = true,
  children,
  type = "default",
  onClose,
}) {
  const isDos = type === "dos";

  return (
    <div className="w-full h-full flex flex-col shadow-[2px_2px_10px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
      {/* Title Bar */}
      <div
        className={`
        px-2 py-1 flex justify-between items-center select-none
        ${isDos ? "bg-gradient-to-r from-gray-700 to-gray-600" : "bg-gradient-to-r from-[#000080] to-[#1084d0]"}
      `}
      >
        <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white">
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex gap-1">
          <button className="w-5 h-5 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black flex items-center justify-center active:border-t-black active:border-l-black active:bg-gray-400">
            <Minus className="w-3 h-3 text-black" />
          </button>
          <button className="w-5 h-5 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black flex items-center justify-center active:border-t-black active:border-l-black active:bg-gray-400">
            <Square className="w-3 h-3 text-black" />
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black flex items-center justify-center active:border-t-black active:border-l-black active:bg-gray-400"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Menu Bar (Optional) */}
      {menu && !isDos && (
        <div className="bg-[#c0c0c0] px-2 py-1 flex gap-4 text-sm border-b border-gray-400">
          <span className="underline cursor-pointer decoration-1 underline-offset-2">
            F
          </span>
          ile
          <span className="underline cursor-pointer decoration-1 underline-offset-2">
            E
          </span>
          dit
          <span className="underline cursor-pointer decoration-1 underline-offset-2">
            V
          </span>
          iew
          <span className="cursor-pointer">Help</span>
        </div>
      )}

      {/* Content Area */}
      <div
        className={`flex-1 overflow-hidden ${isDos ? "bg-black p-2 font-mono" : "bg-[#c0c0c0] p-1"}`}
      >
        {children}
      </div>

      {/* Status Bar (Bottom) */}
      {!isDos && (
        <div className="bg-[#c0c0c0] border-t border-gray-400 p-1 flex justify-between text-xs text-gray-600 font-sans shadow-[inset_1px_1px_0px_#fff]">
          <div className="w-1/2 px-2 border border-gray-400 border-r-white border-b-white">
            Ready
          </div>
          <div className="px-2 border border-gray-400 border-r-white border-b-white">
            NUM
          </div>
        </div>
      )}
    </div>
  );
}

// --- CONTENT COMPONENTS ---

const SLIDE_CONTENT = {
  // TITLE SCREEN
  0: (
    <div className="relative flex flex-col items-center justify-center h-full p-8 overflow-hidden bg-white border-t-2 border-l-2 border-gray-800">
      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-[repeat(20,minmax(0,1fr))] opacity-5 pointer-events-none">
        {[...Array(400)].map((_, i) => (
          <div key={i} className="border-b border-r border-gray-400"></div>
        ))}
      </div>

      <div className="z-10 space-y-8 text-center">
        <Briefcase className="w-24 h-24 mx-auto text-black" />
        <h1 className="pb-4 font-mono text-5xl font-bold tracking-tighter uppercase border-b-4 border-black">
          OFFICE OF SUSPICION
        </h1>
        <div className="inline-block bg-blue-800 text-white font-bold font-mono px-6 py-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] text-xl">
          NEW HIRE ONBOARDING // V2.0
        </div>
        <div className="mt-8 font-mono text-sm text-gray-500">
          C:\CORP\DATA\HANDBOOK.EXE
          <br />
          INTERNAL AUDIT DEPT | EST. 1999
        </div>
      </div>
    </div>
  ),

  // NOTEPAD: MISSION
  1: (
    <div className="h-full p-6 overflow-y-auto font-mono text-sm text-black bg-white border-2 border-gray-500 select-text inset-shadow">
      <p className="mb-4">FROM: INTERNAL AUDIT DEPT</p>
      <p className="mb-4">TO: ALL STAFF</p>
      <p className="mb-8 font-bold">SUBJECT: FRAUD DETECTION PROTOCOLS</p>
      <p className="mb-4">--------------------------------------------------</p>
      <p className="mb-6 font-bold text-red-600">
        *** URGENT MEMO: HIGH PRIORITY ***
      </p>

      <p className="mb-4">
        Management has detected discrepancies in the ledger. <br />
        FRAUD is occurring within this office.
      </p>

      <div className="pl-4 mb-6 ml-4 border-l-2 border-black">
        <p className="mb-2 font-bold underline">THE STAFF (GOOD GUYS):</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Roles: Accountants, Auditors, Controllers.</li>
          <li>Objective: Identify and FIRE the embezzlers.</li>
        </ul>
      </div>

      <div className="pl-4 mb-6 ml-4 border-l-2 border-black">
        <p className="mb-2 font-bold underline">THE FRAUDSTERS (BAD GUYS):</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Roles: Hidden infiltrators.</li>
          <li>Goal: Eliminate staff until they have majority.</li>
        </ul>
      </div>

      {/* Popup Dialog Simulation */}
      <div className="absolute bottom-10 right-10 w-64 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black shadow-xl p-1 z-20">
        <div className="flex items-center justify-between px-1 mb-2 text-xs font-bold text-white bg-blue-900">
          <span>Security Alert</span>
          <X className="w-3 h-3 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 p-2">
          <ShieldAlert className="w-8 h-8 text-yellow-600" />
          <div className="text-xs">
            <strong>SUSPICIOUS ACTIVITY DETECTED</strong>
            <br />
            Unauthorized calculations found in Sector 7.
          </div>
        </div>
        <div className="flex justify-center pb-2">
          <button className="px-4 py-0.5 border-2 border-white border-b-black border-r-black bg-[#c0c0c0] active:border-t-black active:bg-gray-400 text-xs">
            OK
          </button>
        </div>
      </div>
    </div>
  ),

  // DATABASE: ROLES
  2: (
    <div className="h-full p-4 overflow-y-auto bg-gray-200 border-2 border-gray-600 inset-shadow">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1 */}
        <div className="flex flex-col p-1 bg-white border-2 border-gray-400">
          <div className="py-1 mb-2 text-sm font-bold text-center text-white bg-blue-900">
            ACCOUNTANT
          </div>
          <div className="flex flex-col items-center flex-1 p-2 text-center">
            <Calculator className="w-12 h-12 mb-2 text-gray-500" />
            <span className="bg-yellow-100 border border-black px-2 text-[10px] uppercase mb-2">
              Majority Role
            </span>
            <p className="mb-4 text-xs italic">"Numbers don't lie."</p>

            <div className="w-full pt-2 space-y-2 text-xs text-left border-t">
              <div>
                <strong className="text-blue-800">☀ DAY SHIFT</strong>
                <p>Analyze logs and cast your VOTE.</p>
              </div>
              <div>
                <strong className="text-blue-800">☾ NIGHT SHIFT</strong>
                <p className="font-bold text-red-700">INVOICE VERIFICATION</p>
                <p>Solve math problems to earn a "Budget Surplus".</p>
                <div className="bg-yellow-50 border border-yellow-200 p-1 mt-1 text-[10px]">
                  Surplus unlocks clues about deceased players.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col p-1 bg-white border-2 border-gray-400">
          <div className="py-1 mb-2 text-sm font-bold text-center text-white bg-blue-900">
            AUDITOR
          </div>
          <div className="flex flex-col items-center flex-1 p-2 text-center">
            <Search className="w-12 h-12 mb-2 text-gray-500" />
            <span className="bg-yellow-100 border border-black px-2 text-[10px] uppercase mb-2">
              Investigator
            </span>

            <div className="w-full pt-2 mt-4 space-y-2 text-xs text-left border-t">
              <div>
                <strong className="text-blue-800">☾ NIGHT SHIFT</strong>
                <p className="font-bold">INTERNAL AUDIT</p>
                <p>Investigate ONE player to reveal their true alignment:</p>
                <div className="py-1 mt-1 font-mono text-center text-green-500 bg-black">
                  STATUS: SAFE / FRAUD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col p-1 bg-white border-2 border-gray-400">
          <div className="py-1 mb-2 text-sm font-bold text-center text-white bg-blue-900">
            CONTROLLER
          </div>
          <div className="flex flex-col items-center flex-1 p-2 text-center">
            <Shield className="w-12 h-12 mb-2 text-gray-500" />
            <span className="bg-yellow-100 border border-black px-2 text-[10px] uppercase mb-2">
              Protector
            </span>

            <div className="w-full pt-2 mt-4 space-y-2 text-xs text-left border-t">
              <div>
                <strong className="text-blue-800">☾ NIGHT SHIFT</strong>
                <p className="font-bold">ASSET FREEZE</p>
                <p>Protect ONE player from being eliminated by Fraudsters.</p>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                  *Cannot protect same person twice in a row.*
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  // MS-DOS: FRAUDSTERS
  3: (
    <div className="h-full p-4 overflow-y-auto font-mono text-sm text-green-500 bg-black">
      <p>Microsoft(R) Windows 95</p>
      <p>(C)Copyright Microsoft Corp 1981-1995.</p>
      <br />
      <p>C:\WINDOWS\SYSTEM32&gt; RUN SECURITY_ALERT.BAT</p>
      <p className="animate-pulse">... EXECUTING SCRIPT ...</p>
      <br />
      <p>==================================================</p>
      <p className="text-lg font-bold text-red-500 blink">
        &gt;&gt;&gt; WARNING: HOSTILE ELEMENTS DETECTED &lt;&lt;&lt;
      </p>
      <p>==================================================</p>
      <br />

      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-green-800">
        <div>
          <strong className="text-white underline">
            IDENTITY: THE FRAUDSTERS
          </strong>
          <ul className="mt-2 space-y-1 list-none">
            <li>
              &gt; STATUS: <span className="text-red-500">HIDDEN TEAM</span>
            </li>
            <li>&gt; EMBEDDED WITHIN STAFF</li>
            <li>&gt; GOAL: ELIMINATE ALL THREATS</li>
          </ul>
          <br />
          <p className="inline-block px-1 text-white bg-green-900">
            ☾ NIGHT ACTION:
          </p>
          <ul className="mt-2 space-y-1">
            <li>&gt; COORDINATE TARGET SELECTION</li>
            <li>
              &gt; EXECUTE:{" "}
              <span className="px-1 text-red-500 bg-red-900">
                KILL (1) EMPLOYEE
              </span>
            </li>
          </ul>
        </div>

        <div className="relative p-2 border border-green-500">
          <div className="absolute px-1 text-white bg-black -top-3 left-2">
            STRATEGY_GUIDE.TXT
          </div>
          <p className="text-gray-400">// TOP SECRET INSTRUCTIONS //</p>
          <br />
          <p>
            1. <span className="font-bold text-white">BLEND IN:</span>
          </p>
          <p className="pl-4">Fake doing math tasks.</p>
          <p className="pl-4">"Look busy."</p>
          <br />
          <p>
            2. <span className="font-bold text-white">DECEPTION:</span>
          </p>
          <p className="pl-4">Frame innocent Accountants.</p>
          <p className="pl-4">"I saw him vent..." (Wait, wrong game)</p>
          <p className="pl-4">"He wasn't doing his invoices!"</p>

          <div className="absolute p-4 text-4xl font-black text-red-600 transform -translate-x-1/2 -translate-y-1/2 border-4 border-red-600 opacity-50 pointer-events-none top-1/2 left-1/2 rotate-12">
            INTERNAL THREAT
          </div>
        </div>
      </div>
      <br />
      <p className="animate-blink">C:\WINDOWS\SYSTEM32&gt; _</p>
    </div>
  ),

  // NIGHT SHIFT APP
  4: (
    <div className="h-full flex flex-col md:flex-row bg-[#c0c0c0]">
      {/* Left Pane: Log */}
      <div className="flex flex-col w-full p-2 font-mono text-xs text-green-500 bg-black border-r-2 border-white md:w-1/2">
        <div className="flex justify-between px-1 mb-2 font-sans font-bold text-black bg-gray-300">
          <span>SCHEDULE_NIGHT.LOG</span>
          <span>🔒 READ ONLY</span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          <p>[00:00:01] SYSTEM: INITIATING NIGHT PHASE...</p>
          <p>[00:00:05] AUDIO: DISABLED. SILENCE ENFORCED.</p>
          <p className="text-red-500">
            [00:01:20] ALERT: FRAUDSTERS ACTIVE. TARGET SELECTION IN PROGRESS...
          </p>
          <p className="text-green-300">
            [00:02:15] ACTION: CONTROLLER DEPLOYED ASSET PROTECTION.
          </p>
          <p className="text-yellow-300">
            [00:03:00] ACTION: AUDITOR REVIEWING FILES...
          </p>
          <p className="font-bold text-white">
            [00:03:45] ACCOUNTANTS: PROCESSING INVOICES...
          </p>
          <p className="animate-pulse">&gt; WAITING FOR INPUT...</p>
        </div>
      </div>

      {/* Right Pane: Invoice Task */}
      <div className="flex flex-col w-full p-4 md:w-1/2">
        <div className="flex justify-between p-1 px-2 mb-1 text-xs font-bold text-center bg-white border-2 border-gray-600">
          <span>INVOICE_VERIFY.EXE</span>
          <span>TASK MANAGER</span>
        </div>
        <div className="relative flex flex-col items-center justify-center flex-1 p-4 bg-white border-2 border-gray-400 shadow-inner">
          {/* Fake Invoice */}
          <div className="w-full pb-2 mb-4 border-b-2 border-black">
            <div className="font-serif text-xl font-bold">INVOICE #4920</div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>DATE: 1995-10-24</span>
              <span className="font-bold text-red-600">URGENT</span>
            </div>
          </div>

          <div className="mb-6 font-mono text-4xl font-bold">
            1,240 + 560 = ?
          </div>

          <div className="flex w-full gap-4">
            <button className="flex-1 py-3 font-bold bg-gray-100 border-2 border-black hover:bg-gray-200">
              1,800
            </button>
            <button className="flex-1 py-3 font-bold bg-gray-100 border-2 border-black hover:bg-gray-200">
              1,700
            </button>
          </div>

          <p className="mt-4 text-xs italic text-gray-500">
            "Solve frantically to prove innocence!"
          </p>

          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-[10px] font-bold mb-1">
              TEAM QUOTA PROGRESS:
            </div>
            <div className="relative h-4 bg-gray-300 border border-gray-500">
              <div className="absolute left-0 top-0 h-full bg-blue-800 w-[75%]"></div>
              <div className="absolute right-1 top-0 text-[10px]">75%</div>
            </div>
          </div>

          <div className="absolute px-2 py-1 text-sm font-bold text-green-600 transform border-2 border-green-600 bottom-10 right-4 -rotate-12 opacity-40">
            PENDING
          </div>
        </div>
        <div className="text-[10px] text-blue-900 mt-2 text-center font-bold">
          🛈 BUDGET SURPLUS UNLOCKS ROLE REVEALS
        </div>
      </div>
    </div>
  ),

  // MORNING WIZARD
  5: (
    <div className="flex flex-col h-full bg-gray-200">
      <div className="flex items-center h-16 px-4 bg-blue-900">
        <Coffee className="w-8 h-8 mr-3 text-yellow-400" />
        <div>
          <h2 className="text-lg font-bold text-white">
            Morning Meeting Procedure
          </h2>
          <p className="text-xs text-blue-200">
            Step-by-step guide for daily operations.
          </p>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="relative flex gap-6">
          {/* Step 1 */}
          <div className="z-10 flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-800 border-2 border-white shadow-md">
              1
            </div>
            <div className="h-full w-0.5 bg-gray-400 my-2"></div>
          </div>
          <div className="pb-8">
            <h3 className="font-bold text-blue-900">READ SECURITY_LOG.TXT</h3>
            <p className="mt-1 text-sm text-gray-700">
              Review the night's events to identify eliminated staff.
            </p>
            <div className="p-2 mt-2 font-mono text-xs bg-white border border-gray-400">
              <span className="text-green-600">
                ✔ Budget Surplus: Met? -&gt; Reveal Roles
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex gap-6">
          <div className="z-10 flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-800 border-2 border-white shadow-md">
              2
            </div>
            <div className="h-full w-0.5 bg-gray-400 my-2"></div>
          </div>
          <div className="pb-8">
            <h3 className="font-bold text-blue-900">DISCUSSION PHASE</h3>
            <p className="mt-1 text-sm text-gray-700">
              Deliberate with team members.
            </p>
            <ul className="pl-2 mt-2 text-xs italic text-gray-600 list-disc list-inside">
              <li>Who didn't do their math?</li>
              <li>Who is acting suspicious?</li>
            </ul>
          </div>
        </div>

        <div className="relative flex gap-6">
          <div className="z-10 flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-800 border-2 border-white shadow-md">
              3
            </div>
          </div>
          <div>
            <h3 className="font-bold text-red-900">TERMINATION VOTE</h3>
            <p className="mt-1 text-sm text-gray-700">
              Submit a request to fire one employee.
            </p>
            <div className="flex items-center justify-between gap-4 p-2 mt-2 bg-gray-300 border border-gray-500">
              <span className="text-xs font-bold text-red-600">
                WARNING: Majority vote is final.
              </span>
              <button className="bg-red-600 text-white px-3 py-1 text-xs border-2 border-red-800 shadow-md active:translate-y-0.5 font-bold">
                SUBMIT VOTE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  // WORD DOC: TIPS
  6: (
    <div className="flex justify-center h-full p-8 overflow-y-auto bg-gray-500">
      <div className="w-full max-w-[600px] bg-white shadow-2xl min-h-[600px] p-12 text-black font-serif relative">
        <h1 className="mb-4 text-2xl font-bold underline uppercase decoration-2">
          Productivity Guidelines
        </h1>

        <div className="mb-6 text-sm">
          <p>
            <strong>TO:</strong> ALL EMPLOYEES
          </p>
          <p>
            <strong>FROM:</strong> HUMAN RESOURCES
          </p>
          <p>
            <strong>DATE:</strong> OCTOBER 24, 1995
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            As we navigate these challenging times of internal audits and sudden
            terminations, management would like to remind all staff of the
            following operational guidelines:
          </p>

          <div className="pl-4 border-l-4 border-blue-800">
            <h3 className="font-bold text-blue-800">
              FOR ACCOUNTANTS (THE INNOCENT):
            </h3>
            <p className="italic">"Your math is your alibi."</p>
            <p className="mt-2">
              Keep working diligently on your invoices. A completed task list
              proves you were too busy to be crawling in the ventilation system.
            </p>
          </div>

          <div className="pl-4 border-l-4 border-red-800">
            <h3 className="font-bold text-red-800">
              FOR FRAUDSTERS (THE GUILTY):
            </h3>
            <p className="italic">"Loose lips sink partnerships."</p>
            <p className="mt-2">
              Use the private night chat channel discreetly. Coordinate your
              attacks, but beware—loud typing may alert the Auditor.
            </p>
          </div>
        </div>

        <div className="absolute p-2 text-xl font-bold transform border-4 border-black top-10 right-10 rotate-6 opacity-20">
          CONFIDENTIAL
        </div>

        {/* Clippy-ish Helper */}
        <div className="absolute bottom-10 right-[-20px] bg-yellow-100 border border-black p-3 rounded-tr-xl w-48 shadow-lg text-xs font-sans transform -rotate-3 z-10">
          <p className="mb-1 font-bold">
            It looks like you're trying to survive.
          </p>
          <p>Would you like help?</p>
          <ul className="mt-2 text-blue-800 underline list-disc list-inside cursor-pointer">
            <li>Accuse the quiet guy</li>
            <li>Check the logs</li>
            <li>Hide under desk</li>
          </ul>
        </div>
      </div>
    </div>
  ),

  // LOADING/END
  7: (
    <div className="h-full flex flex-col items-center justify-center bg-[#c0c0c0] p-8">
      <div className="w-full max-w-md p-1 border-2 border-white border-r-gray-600 border-b-gray-600">
        <div className="flex justify-between px-2 py-1 text-sm font-bold text-white bg-blue-900">
          <span>System Initialization</span>
          <X className="w-4 h-4" />
        </div>
        <div className="flex flex-col items-center p-6">
          <div className="flex w-full gap-4 mb-6">
            <HourglassIcon className="w-12 h-12 text-blue-900 animate-spin-slow" />
            <div className="space-y-1 font-sans text-sm">
              <p>Connecting to OFFICE_SERVER...</p>
              <p className="text-gray-500">
                Loading assets: fraud_detection.dll
              </p>
              <p className="text-gray-500">Verifying employee credentials...</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 mb-2 bg-white border-2 border-gray-600">
            <div className="absolute top-0 left-0 h-full bg-blue-900 w-[100%] flex gap-0.5 p-0.5">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-full h-full bg-blue-700"></div>
              ))}
            </div>
          </div>
          <div className="mb-8 text-xs">100% Completed</div>

          <h2 className="mb-2 font-mono text-xl font-bold tracking-widest text-blue-900">
            INITIALIZING LOBBY...
          </h2>
          <h1 className="mb-6 font-mono text-2xl font-bold text-red-600 animate-pulse">
            GOOD LUCK.
          </h1>

          <div className="flex justify-center w-full gap-4">
            <button className="px-6 py-1 border-2 border-black border-t-white border-l-white bg-[#c0c0c0] active:border-t-black font-bold text-sm">
              Enter Office
            </button>
            <button className="px-6 py-1 border-2 border-black border-t-white border-l-white bg-[#c0c0c0] active:border-t-black text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

// --- CONFIGURATION FOR SLIDES ---
const SLIDES_CONFIG = [
  {
    id: 0,
    title: "OFFICE OF SUSPICION",
    icon: <Briefcase className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 1,
    title: "MISSION_STATEMENT.TXT - Notepad",
    icon: <FileText className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 2,
    title: "STAFF_ROLES.EXE - Employee Database",
    icon: <User className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 3,
    title: "MS-DOS Prompt - SECURITY_ALERT.BAT",
    icon: <FileType className="w-4 h-4" />,
    type: "dos",
  },
  {
    id: 4,
    title: "NIGHT_SHIFT_MANAGER.EXE",
    icon: <MoonIcon className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 5,
    title: "MORNING_MEETING.EXE - Day Shift Wizard",
    icon: <Coffee className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 6,
    title: "Microsoft Word - HR_MEMO.DOC",
    icon: <FileText className="w-4 h-4" />,
    type: "default",
  },
  {
    id: 7,
    title: "System Initialization",
    icon: <HardDrive className="w-4 h-4" />,
    type: "default",
  },
];

function MoonIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
function HourglassIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function HandbookPage() {
  const router = useRouter();
  const [slideIdx, setSlideIdx] = useState(0);
  const [time, setTime] = useState("");

  // Clock
  useEffect(() => {
    const t = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const next = () => {
    if (slideIdx < SLIDES_CONFIG.length - 1) setSlideIdx(slideIdx + 1);
    else router.push("/");
  };

  const prev = () => {
    if (slideIdx > 0) setSlideIdx(slideIdx - 1);
  };

  const config = SLIDES_CONFIG[slideIdx];

  // Handle keyboard nav
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slideIdx]);

  return (
    <div className="w-full h-screen bg-[#008080] flex flex-col overflow-hidden font-sans select-none cursor-default">
      {/* DESKTOP AREA */}
      <div className="flex-1 relative p-4 grid grid-cols-[100px_1fr] gap-4">
        {/* Icons Column */}
        <div className="flex flex-col gap-6">
          <DesktopIcon icon={Monitor} label="My Computer" />
          <DesktopIcon icon={Network} label="Network Neighborhood" />
          <DesktopIcon icon={Trash2} label="Recycle Bin" />
          <DesktopIcon icon={Folder} label="My Briefcase" />
          <DesktopIcon
            icon={FileText}
            label="Game Rules.txt"
            active={true}
            onClick={() => {}}
          />
        </div>

        {/* Active Window */}
        <div className="flex items-center justify-center p-2 md:p-8">
          <div className="w-full max-w-4xl h-full max-h-[700px]">
            <Win95Window
              title={config.title}
              icon={config.icon}
              type={config.type}
              onClose={() => router.push("/")}
            >
              {SLIDE_CONTENT[slideIdx]}
            </Win95Window>
          </div>
        </div>
      </div>

      {/* TASKBAR */}
      <div className="h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center justify-between px-1 relative z-50 shadow-[0_-2px_5px_rgba(0,0,0,0.2)]">
        <div className="flex items-center h-full gap-2 py-1">
          {/* START BUTTON */}
          <button
            onClick={() => router.push("/")}
            className="h-full px-2 flex items-center gap-1 font-bold border-2 border-white border-b-black border-r-black bg-[#c0c0c0] active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-gray-300 shadow-sm"
          >
            <div className="relative w-4 h-4 overflow-hidden bg-black">
              <div className="absolute top-0 left-0 w-2 h-2 bg-[#ff3333]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#33cc33]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#3366ff]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#ffff33]"></div>
            </div>
            <span>Start</span>
          </button>

          <div className="w-0.5 h-6 bg-gray-400 mx-1"></div>

          {/* Active App Tab */}
          <div className="h-full w-48 bg-[#d4d4d4] border-2 border-white border-b-black border-r-black border-t-black border-l-black shadow-[inset_1px_1px_0px_#000] flex items-center px-2 gap-2">
            {config.icon}
            <span className="text-xs font-bold truncate">{config.title}</span>
          </div>
        </div>

        {/* TRAY */}
        <div className="flex h-full gap-2 py-1">
          <div className="h-full border-2 border-gray-500 border-b-white border-r-white bg-[#c0c0c0] px-3 flex items-center gap-2 text-xs inset-shadow">
            <Volume2 className="w-4 h-4" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Navigation Hint Overlay (Subtle) */}
      <div className="absolute font-mono text-xs pointer-events-none bottom-12 right-4 text-white/50">
        [ARROWS] NAVIGATE • [ESC] EXIT
      </div>
    </div>
  );
}
