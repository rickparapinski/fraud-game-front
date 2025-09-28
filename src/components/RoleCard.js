"use client";

export default function RoleCard({ role, instructions, teammates = [] }) {
  const pill = (txt) => (
    <span className="px-2 py-0.5 rounded-full text-xs border">{txt}</span>
  );

  const titleColor =
    {
      fraudster: "text-red-600",
      auditor: "text-blue-600",
      controller: "text-emerald-600",
      accountant: "text-gray-800",
    }[role] || "text-gray-800";

  return (
    <div className="border rounded-xl p-4 space-y-3 shadow-sm">
      <div className={`text-lg font-semibold ${titleColor}`}>
        Your role: {role?.toUpperCase()}
      </div>
      <p className="text-sm">{instructions}</p>

      {role === "fraudster" && teammates.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Your fellow fraudsters:</div>
          <ul className="list-disc list-inside space-y-1">
            {teammates.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {pill("Secret")}
        {pill("Keep this private")}
      </div>
    </div>
  );
}
