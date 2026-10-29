import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/theme";
import { Footer, Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "CampusPulse AI — Student Growth & Referral Engine",
  description: "Turn student communities into measurable workshop registrations.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
            Skip to content
          </a>
          <Nav />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
