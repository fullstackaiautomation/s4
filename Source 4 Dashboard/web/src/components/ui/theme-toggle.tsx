"use client";

import { useEffect, useState } from "react";
import { Button } from "./button";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Load and apply theme on client side only
  useEffect(() => {
    try {
      const html = document.documentElement;
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

      // Apply initial theme
      setThemeState(initialTheme);
      html.classList.remove("light", "dark");
      html.classList.add(initialTheme);
      html.style.colorScheme = initialTheme;

      setMounted(true);
    } catch (error) {
      console.error("Failed to load theme:", error);
      setMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    try {
      const html = document.documentElement;
      const newTheme = theme === "light" ? "dark" : "light";

      // Update state
      setThemeState(newTheme);

      // Update DOM immediately
      html.classList.remove("light", "dark");
      html.classList.add(newTheme);
      html.style.colorScheme = newTheme;

      // Persist preference
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  };

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}