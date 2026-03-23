"use client";
import { useEffect, useRef } from "react";

interface AdSlotProps {
  slot: string; // Adsterra theke pawa 'key' ekhane boshaben
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

const AdSlot = ({ slot, format = "auto", className = "" }: AdSlotProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  // Format onujayi height ebong width set kora
  const getDimensions = () => {
    switch (format) {
      case "horizontal": return { w: 728, h: 90 };
      case "rectangle": return { w: 300, h: 250 };
      case "vertical": return { w: 160, h: 600 };
      default: return { w: 160, h: 600 }; // Default format
    }
  };

  const { w, h } = getDimensions();

  useEffect(() => {
    // Prottekbar slot change hole jeno purano script gulo clear hoye jay
    if (adRef.current) {
      adRef.current.innerHTML = ""; 

      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.innerHTML = `
        atOptions = {
          'key' : '${slot}',
          'format' : 'iframe',
          'height' : ${h},
          'width' : ${w},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `//://www.highperformanceformat.com{slot}/invoke.js`;

      adRef.current.appendChild(configScript);
      adRef.current.appendChild(invokeScript);
    }
  }, [slot, format, h, w]); // Slot ba format change hole script reload hobe

  return (
    <div className={`w-full flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        ref={adRef}
        className="bg-muted/10 rounded-lg border border-dashed border-border/50 overflow-hidden"
        style={{ minHeight: `${h}px`, minWidth: `${w}px` }}
      />
      <p className="text-[10px] text-muted-foreground/30 select-none uppercase tracking-tighter">
        Advertisement — {format}
      </p>
    </div>
  );
};

export default AdSlot;
