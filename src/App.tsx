import React from "react";
import { RouterProvider, usePathname } from "@/shims/navigation";
import { QueryProvider } from "@/components/query-provider";
import { CommandPaletteProvider } from "@/components/command-palette";
import { Toaster } from "@/components/ui/toast";
import { AppShell } from "@/components/app-shell";
import { SessionGate } from "@/components/auth/session-gate";

// Production Views for NO Studio
import { MultiDisciplinaryProductView } from "@/components/hardware/multi-disciplinary-product-view";
import { ForgeOmniverseView } from "@/components/forge/forge-omniverse-view";
import { HardwareIdeView } from "@/components/ide/hardware-ide-view";
import { PersistentJobsView } from "@/components/jobs/persistent-jobs-view";
import { ErrorBoundary } from "./components/error-boundary";

function RouteRenderer() {
  const pathname = usePathname();

  if (pathname === "/product" || pathname === "/pcb") {
    return <MultiDisciplinaryProductView />;
  }
  if (pathname === "/ide") {
    return <HardwareIdeView />;
  }
  if (pathname === "/jobs") {
    return <PersistentJobsView />;
  }

  // Default to NO Omniverse Physical Science & Engineering Forge
  return <ForgeOmniverseView />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <RouterProvider>
          <CommandPaletteProvider>
            <SessionGate>
              <AppShell>
                <RouteRenderer />
              </AppShell>
              <Toaster />
            </SessionGate>
          </CommandPaletteProvider>
        </RouterProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
