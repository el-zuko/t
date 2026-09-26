import React, { createContext, useContext, useState, useEffect } from "react";

export interface Router {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (path: string) => void;
}

const NavigationContext = createContext<{
  pathname: string;
  navigate: (path: string) => void;
}>({
  pathname: typeof window !== "undefined" ? window.location.pathname : "/",
  navigate: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname || "/" : "/"
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      setPathname(path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <NavigationContext.Provider value={{ pathname, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const RouterProvider = NavigationProvider;

export function useRouter(): Router {
  const ctx = useContext(NavigationContext);
  return {
    push: (path: string) => {
      if (ctx.navigate) ctx.navigate(path);
      else if (typeof window !== "undefined") window.location.pathname = path;
    },
    replace: (path: string) => {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", path);
        if (ctx.navigate) ctx.navigate(path);
      }
    },
    back: () => {
      if (typeof window !== "undefined") window.history.back();
    },
    forward: () => {
      if (typeof window !== "undefined") window.history.forward();
    },
    refresh: () => {
      if (typeof window !== "undefined") window.location.reload();
    },
    prefetch: () => {},
  };
}

export function usePathname(): string {
  const ctx = useContext(NavigationContext);
  return ctx.pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
}

export function useSearchParams(): URLSearchParams {
  return typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
}
