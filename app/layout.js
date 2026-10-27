import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Student Event Registration",
  description: "Browse and register for college events",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold text-indigo-600">
              🎓 CampusEvents
            </Link>
            <div className="flex gap-5 text-sm font-medium">
              <Link href="/" className="hover:text-indigo-600">Events</Link>
              <Link href="/admin" className="hover:text-indigo-600">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
