"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logFunnel } from "@/lib/analytics";

/**
 * First-party PageView tracker. Fires for EVERY visitor (no marketing-consent
 * gate) on first mount and on each client-side route change, so the admin
 * funnel counts all traffic — not just visitors who accept marketing cookies.
 * Anonymous and cookieless: see logFunnel(). The admin area is excluded so
 * internal visits don't inflate the numbers.
 */
export function FunnelTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    logFunnel("PageView", { path: pathname });
  }, [pathname]);

  return null;
}
