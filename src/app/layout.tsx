import type { Metadata } from "next";
import Script from "next/script";

import TelegramProvider from "@/components/telegram/telegram-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fight Predict",
  description: "MMA virtual prediction game",
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
          src="https://telegram.org/js/telegram-web-app.js?57"
          strategy="beforeInteractive"
        />

      <TelegramProvider>
          {children}
        </TelegramProvider>
      </body>
    </html>
  );
}