
import type { Metadata, Viewport } from "next";
import StoreProvider from "@/shared/providers/store-provider";
import ThemeProvider from "@/shared/providers/theme-provider";
import SparkleCursor from "@/components/shared/sparkle-cursor";
import Header from "@/components/shared/header";
import { AuthProvider } from "@/context/auth-context";
import "./globals.scss";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "AstroFlare — Your Cosmic Guide",
  description: "Premium astrological AI platform — birth charts, daily horoscopes & cosmic insights.",
  icons: {
    icon: "/app-logo.png",
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AstroFlare",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <ThemeProvider>
            <StoreProvider>
              <Header />
              {children}
            </StoreProvider>
            <SparkleCursor />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
