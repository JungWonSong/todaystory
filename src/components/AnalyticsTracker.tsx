"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trackPageLeave, trackPageView } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const enteredAtRef = useRef(Date.now());
  const pathRef = useRef(pathname);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    const previousPath = pathRef.current;
    const enteredAt = enteredAtRef.current;
    const durationSeconds = Math.round((Date.now() - enteredAt) / 1000);

    if (previousPath && previousPath !== pathname && durationSeconds >= 1) {
      void trackPageLeave(previousPath, userIdRef.current, durationSeconds);
    }

    pathRef.current = pathname;
    enteredAtRef.current = Date.now();
    void trackPageView(pathname, userIdRef.current);
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const durationSeconds = Math.round(
        (Date.now() - enteredAtRef.current) / 1000,
      );

      if (durationSeconds >= 1) {
        void trackPageLeave(pathRef.current, userIdRef.current, durationSeconds);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}
