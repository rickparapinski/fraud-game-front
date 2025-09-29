// components/ui/Button.jsx
import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-accent-gold text-ink-800 hover:brightness-110 focus:ring-accent-gold",
    secondary: "bg-white/10 text-white hover:bg-white/20 focus:ring-white/30",
    danger:
      "bg-role-fraudster text-white hover:brightness-110 focus:ring-role-fraudster",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
