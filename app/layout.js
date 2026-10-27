import Link from "next/link";
import { Figtree, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const sourceCode = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code" });

export const metadata = {
  title: "Student Event Registration",
  description: "Browse and register for college events",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${figtree.variable} ${sourceCode.variable}`}>
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-hairline bg-white/95 backdrop-blur">
          <nav className="container-page flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-md bg-teal-deep">
                <span className="size-2.5 rounded-full bg-brand-green" />
              </span>
              CampusEvents
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/" className="btn-ghost">Events</Link>
              <Link href="/admin" className="btn-primary">Admin</Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-teal-deep text-sm text-muted">
          <div className="container-page flex flex-col gap-4 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">CampusEvents</p>
              <p className="mt-1">Student Event Registration System · Next.js + MongoDB Atlas</p>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-white">Events</Link>
              <Link href="/admin" className="hover:text-white">Admin</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
