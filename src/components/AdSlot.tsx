"use client";
import { useEffect, useRef } from "react";

interface AdSlotProps {
  slot: string; ee0bae7e8602b61974fc88c1777097ec
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

const AdSlot = ({ slot, format = "auto", className = "" }: AdSlotProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ""; // Purano ad clear kora
      
      const width = format === "horizontal" ? 728 : format === "rectangle" ? 300 : 160;
      const height = format === "horizontal" ? 90 : format === "rectangle" ? 250 : 600;

      // React-e dynamic script load korar niyom
      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.innerHTML = `
        atOptions = {
          'key' : '${slot}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = \`//://www.highperformanceformat.com\${slot}/invoke.js\`;

      containerRef.current.appendChild(configScript);
      containerRef.current.appendChild(invokeScript);
    }
  }, [slot, format]);

  return (
    <div className={`w-full flex flex-col items-center justify-center my-4 \${className}\`}>
      <div 
        ref={containerRef}
        className="bg-muted/5 border border-dashed border-border/30 rounded-lg overflow-hidden"
        style={{ minHeight: format === "horizontal" ? "90px" : format === "rectangle" ? "250px" : "600px" }}
      />
      <p className="text-[10px] text-muted-foreground/20 mt-1 uppercase">Advertisement — {slot}</p>
    </div>
  );
};

export default AdSlot;
