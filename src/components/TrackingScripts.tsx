"use client";

import { useEffect, useState } from "react";
import { MetaPixel } from "./MetaPixel";
import { GoogleTag } from "./GoogleTag";
import { Clarity } from "./Clarity";

interface SiteConfig {
  metaPixelId: string;
  googleTagId: string;
  clarityId: string;
}

/**
 * Loads all third-party tracking (Meta Pixel, Google tag, Clarity) from
 * /api/site-config instead of build-time env vars, so tracking IDs can be
 * pasted into the admin Settings tab and go live without a redeploy. Env vars
 * still win when set (the API resolves that server-side). Each script only
 * mounts when its ID is configured. Tracking runs for all visitors — the
 * cookie banner/consent gate was deliberately removed (small-shop decision).
 */
export function TrackingScripts() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        /* tracking must never break the store */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!config) return null;
  return (
    <>
      {config.metaPixelId && <MetaPixel pixelId={config.metaPixelId} />}
      {config.googleTagId && <GoogleTag tagId={config.googleTagId} />}
      {config.clarityId && <Clarity clarityId={config.clarityId} />}
    </>
  );
}
