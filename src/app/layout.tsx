
import type { Metadata } from "next";
import StoreProvider from "@/shared/providers/store-provider";
import ThemeProvider from "@/shared/providers/theme-provider";
import SparkleCursor from "@/components/shared/sparkle-cursor";
import Header from "@/components/shared/header";
import { AuthProvider } from "@/context/auth-context";
import { ZodiacProvider } from "@/context/zodiac-context";
import AuthBridge from "@/shared/providers/auth-bridge";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Flare — Your Cosmic Guide",
  description: "Premium astrological AI platform — birth charts, daily horoscopes & cosmic insights.",
  manifest: "/manifest.json",
  icons: {
    icon: "/app-logo.png",
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
              <AuthBridge />
              <ZodiacProvider>
                <Header />
                {children}
              </ZodiacProvider>
            </StoreProvider>
          </ThemeProvider>
          <SparkleCursor />
        </AuthProvider>
      </body>
    </html>
  );
}
