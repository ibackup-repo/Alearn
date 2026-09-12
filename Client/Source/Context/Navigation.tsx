import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useAnimate } from "framer-motion";

type Rect = { top: number; left: number; width: number; height: number };

interface NavigationContextType {
  activeRoute: string | null;
  activeRect: Rect | null;
  fromPath: string | null;
  phase: "idle" | "expanding" | "expanded" | "shrinking";
  triggerTransition: (route: string, rect: Rect) => void;
  setPhase: (phase: "idle" | "expanding" | "expanded" | "shrinking") => void;
  clearTransition: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

const STORAGE_KEY_RECT = "nav_active_rect";
const STORAGE_KEY_FROM = "nav_from_path";
const STORAGE_KEY_ROUTE = "nav_active_route";

// How long the "arrived and staying" state holds the overlay before it
// clears itself. Should be >= the fade duration of the label span below.
const ARRIVAL_HOLD_MS = 250;

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Initialize state directly from sessionStorage so it survives page refreshes!
  const [activeRoute, setActiveRoute] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY_ROUTE));
  const [fromPath, setFromPath] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY_FROM));

  const [activeRect, setActiveRect] = useState<Rect | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY_RECT);
    return stored ? JSON.parse(stored) : null;
  });

  const [phase, setPhase] = useState<"idle" | "expanding" | "expanded" | "shrinking">(() => {
    const storedRoute = sessionStorage.getItem(STORAGE_KEY_ROUTE);
    // If the user refreshed the page while on the target route, don't resurrect
    // the fullscreen overlay — just drop straight to idle. Holding it "expanded"
    // after a hard refresh is what caused the overlay to get stuck forever.
    if (storedRoute && window.location.pathname === storedRoute) {
      return "idle";
    }
    return "idle";
  });

  const location = useLocation();

  const triggerTransition = (route: string, rect: Rect) => {
    const currentPath = location.pathname;
    setFromPath(currentPath);
    setActiveRoute(route);
    setActiveRect(rect);
    setPhase("expanding");

    sessionStorage.setItem(STORAGE_KEY_FROM, currentPath);
    sessionStorage.setItem(STORAGE_KEY_ROUTE, route);
    sessionStorage.setItem(STORAGE_KEY_RECT, JSON.stringify(rect));
  };

  const clearTransition = () => {
    setActiveRoute(null);
    setActiveRect(null);
    setFromPath(null);
    setPhase("idle");

    sessionStorage.removeItem(STORAGE_KEY_FROM);
    sessionStorage.removeItem(STORAGE_KEY_ROUTE);
    sessionStorage.removeItem(STORAGE_KEY_RECT);
  };

  return (
    <NavigationContext.Provider
      value={{
        activeRoute,
        activeRect,
        fromPath,
        phase,
        triggerTransition,
        setPhase,
        clearTransition,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavTransition = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavTransition must be used within NavigationProvider");
  return context;
};

export function GlobalNavOverlay() {
  const { activeRoute, activeRect, fromPath, phase, setPhase, clearTransition } = useNavTransition();
  const location = useLocation();
  const navigate = useNavigate();
  const [scope, animate] = useAnimate();

  // This ref stops animations from triggering twice simultaneously
  const isAnimating = useRef(false);

  // 1. REACT ROUTER MONITOR: Watches for the Back Button, programmatic
  //    navigation, or plain arrival-and-stay on the target route.
  useEffect(() => {
    if (phase !== "expanded") return;

    if (location.pathname === fromPath) {
      // User went back to the origin page -> Trigger shrink!
      setPhase("shrinking");
      return;
    }

    if (location.pathname !== activeRoute) {
      // User navigated somewhere completely unrelated -> Clear instantly
      clearTransition();
      return;
    }

    // FIX: We are on the destination route and staying here. Previously
    // there was no branch for this — the *normal*, expected case — so the
    // fullscreen overlay div stayed mounted forever (only its label text
    // faded out). Clear it after a short hold so the label-fade animation
    // has time to finish before the overlay unmounts.
    const timeout = setTimeout(() => {
      clearTransition();
    }, ARRIVAL_HOLD_MS);

    return () => clearTimeout(timeout);
  }, [location.pathname, phase, fromPath, activeRoute, setPhase, clearTransition]);

  // 2. EXPAND ANIMATION
  useEffect(() => {
    if (phase === "expanding" && activeRect && activeRoute && scope.current && !isAnimating.current) {
      isAnimating.current = true;
      const runExpand = async () => {
        try {
          await animate(
            scope.current,
            {
              top: [activeRect.top, 0],
              left: [activeRect.left, 0],
              width: [activeRect.width, window.innerWidth],
              height: [activeRect.height, window.innerHeight],
              borderRadius: [16, 0],
            },
            { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
          );

          setPhase("expanded");

          // Navigate ONLY after animation completes
          const targetPath = activeRoute.startsWith("/") ? activeRoute : `/${activeRoute}`;
          navigate(targetPath);
        } catch {
          clearTransition();
        } finally {
          isAnimating.current = false;
        }
      };

      runExpand();
    }
  }, [phase, activeRect, activeRoute, animate, scope, navigate, setPhase, clearTransition]);

  // 3. SHRINK ANIMATION
  useEffect(() => {
    if (phase === "shrinking" && activeRect && scope.current && !isAnimating.current) {
      isAnimating.current = true;
      const runShrink = async () => {
        try {
          await animate(
            scope.current,
            {
              top: [0, activeRect.top],
              left: [0, activeRect.left],
              width: [window.innerWidth, activeRect.width],
              height: [window.innerHeight, activeRect.height],
              borderRadius: [0, 16],
            },
            { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
          );

          // BOOM: Only clear the state AFTER the await completes!
          clearTransition();
        } catch {
          clearTransition();
        } finally {
          isAnimating.current = false;
        }
      };

      runShrink();
    }
  }, [phase, activeRect, animate, scope, clearTransition]);

  if (!activeRect || phase === "idle") return null;

  // FIX: "expanded" and "shrinking" both need fullscreen geometry as the
  // *base* style. Previously only "shrinking" got 100vw/100vh/top:0/left:0
  // here, so once React re-rendered after setPhase("expanded") it snapped
  // the div's inline style back to the tiny activeRect values, fighting
  // with whatever Framer Motion had just animated onto the DOM node.
  const isFullscreen = phase === "expanded" || phase === "shrinking";

  return (
    <div
      ref={scope}
      style={{
        position: "fixed",
        top: isFullscreen ? 0 : activeRect.top,
        left: isFullscreen ? 0 : activeRect.left,
        width: isFullscreen ? "100vw" : activeRect.width,
        height: isFullscreen ? "100vh" : activeRect.height,
        borderRadius: isFullscreen ? 0 : 16,
        backgroundColor: "#0f172a",
        zIndex: 99999,
        pointerEvents: "none",
      }}
      className="flex items-center justify-center font-bold text-lg text-white overflow-hidden"
    >
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "expanded" ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeRoute}
      </motion.span>
    </div>
  );
}