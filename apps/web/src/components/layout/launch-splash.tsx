"use client";

import { useEffect, useState } from "react";

// Root layouts persist during client navigation: show once per app launch.
export function LaunchSplash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="launch-splash"
      aria-hidden="true"
      data-testid="launch-splash"
    >
      <div className="launch-splash-brand">
        <img
          src="/assets/brand/fitty-isotype-512.png"
          width={240}
          height={240}
          alt=""
          fetchPriority="high"
          className="launch-splash-isotype"
        />
        <img
          src="/assets/brand/fitty-launch-wordmark.png"
          width={480}
          height={228}
          alt=""
          fetchPriority="high"
          className="launch-splash-wordmark"
        />
      </div>
    </div>
  );
}
