import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll browser window
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Scroll HTML + Body (Safari / some Android browsers)
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });

    // Scroll React root (if layout uses flex / overflow)
    const root = document.getElementById("root");
    if (root) root.scrollTo({ top: 0, behavior: "smooth" });

    // Scroll any page container using overflow-auto
    const scrollers = document.querySelectorAll(
      "[class*='overflow'], [class*='scroll']"
    );

    scrollers.forEach((el) => {
      try {
        el.scrollTo({ top: 0 });
      } catch (_) {}
    });
  }, [pathname]);

  return null;
}
