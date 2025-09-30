import { useEffect, useState, type RefObject } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ScrollControlsProps {
  targetRef: RefObject<HTMLElement>;
  deps?: any[]; // values to watch to recompute overflow (e.g., text value)
}

// Shows Up/Down scroll buttons when the target element has vertical overflow
export default function ScrollControls({ targetRef, deps = [] }: ScrollControlsProps) {
  const [canScroll, setCanScroll] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const recompute = () => {
    const el = targetRef.current as HTMLElement | null;
    if (!el) return;
    const overflow = el.scrollHeight > el.clientHeight + 2;
    setCanScroll(overflow);
    setAtTop(el.scrollTop <= 2);
    setAtBottom(Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 2);
  };

  useEffect(() => {
    recompute();
    const el = targetRef.current as HTMLElement | null;
    if (!el) return;

    const onScroll = () => recompute();
    const onResize = () => recompute();
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    const interval = window.setInterval(recompute, 400); // in case of font/layout changes

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRef, ...deps]);

  const scrollToTop = () => {
    const el = targetRef.current as HTMLElement | null;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const el = targetRef.current as HTMLElement | null;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  if (!canScroll) return null;

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={scrollToTop}
        disabled={atTop}
        className={`h-9 w-9 rounded-full flex items-center justify-center glass-card border-accent/30 shadow-md hover:border-accent/50 hover:bg-accent/10 transition ${
          atTop ? "opacity-40 cursor-not-allowed" : ""
        }`}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        onClick={scrollToBottom}
        disabled={atBottom}
        className={`h-9 w-9 rounded-full flex items-center justify-center glass-card border-accent/30 shadow-md hover:border-accent/50 hover:bg-accent/10 transition ${
          atBottom ? "opacity-40 cursor-not-allowed" : ""
        }`}
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}
