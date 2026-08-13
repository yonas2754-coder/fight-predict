"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [showSplash, setShowSplash] =
    useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black">
      <Image
        src="/images/splash.png"
        alt="Fight Predict"
        fill
        priority
        className="object-cover"
      />
    </div>
  );
}