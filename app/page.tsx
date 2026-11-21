"use client";

import { useCallback, useEffect, useState } from "react";

import { DiscoverTab } from "@/components/DiscoverTab";
import { HomeTab } from "@/components/HomeTab";
import { TabBar, type TabId } from "@/components/TabBar";

export default function Page() {
  const [tab, setTab] = useState<TabId>("home");

  useEffect(() => {
    const applyHash = () => {
      setTab(window.location.hash === "#discover" ? "discover" : "home");
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const handleChange = useCallback((next: TabId) => {
    setTab(next);
    const hash = next === "discover" ? "#discover" : "#home";
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, []);

  return (
    <div className="min-h-dvh w-full bg-[#EAE2F6]">
      <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-bg shadow-2xl">
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <div hidden={tab !== "home"} className="h-full">
            <HomeTab />
          </div>
          <div hidden={tab !== "discover"} className="h-full">
            <DiscoverTab />
          </div>
        </main>

        <TabBar active={tab} onChange={handleChange} />
      </div>
    </div>
  );
}
