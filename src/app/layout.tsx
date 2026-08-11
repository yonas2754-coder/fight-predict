import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramProvider from "@/components/telegram/telegram-provider";
export const metadata: Metadata = {
  title: "FightPredict",
  description:
    "Telegram MMA fight prediction game",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
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
          src="https://telegram.org/js/telegram-web-app.js?63"
          strategy="beforeInteractive"
        />

        <TelegramProvider>
  {children}
</TelegramProvider>
      </body>
    </html>
  );
}