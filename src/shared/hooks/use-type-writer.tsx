import React, { useState, useEffect, useTransition } from "react";

export const useTypewriter = (text: string, speed: number = 50, trigger: boolean = true): string => {
  const [displayedText, setDisplayedText] = useState<string>("");

  useEffect(() => {
    if (!trigger) {
      setDisplayedText("");
      return;
    }

    let i = 0;
    setDisplayedText(""); // Reset
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, trigger]);

  return displayedText;
};