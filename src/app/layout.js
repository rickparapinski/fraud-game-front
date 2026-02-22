import "./globals.css";

export const metadata = {
  title: "Office of Suspicion",
  description: "Department of Internal Auditing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* The background color is now handled by globals.css (var(--bg-wall)) */}
      <body className="flex items-center justify-center min-h-screen">
        {children}
      </body>
    </html>
  );
}
