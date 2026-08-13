import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

import TelegramProvider from "@/components/telegram/telegram-provider";

import SplashScreen from "@/components/splash-screen";

export const metadata: Metadata = {
  title: "Fight Predict",
  description:
    "Telegram MMA prediction app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js?59"
          strategy="beforeInteractive"
        />

        <TelegramProvider>
           <SplashScreen />
          {children}
        </TelegramProvider>
      </body>
    </html>
  );
}