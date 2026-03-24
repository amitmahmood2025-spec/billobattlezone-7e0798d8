"use client";
import { useEffect, useRef } from "react";

interface AdSlotProps {
  slot: string; ee0bae7e8602b61974fc88c1777097ec
  format?: "horizontal" | "vertical" | "rectangle";
  className?: string;
}

const AdSlot = ({ slot, format = "vertical", className = "" }: AdSlotProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Format onujayi dimensions set kora
  const getDimensions = () => {
    switch (format) {
      case "horizontal": return { w: 728, h: 90 };
      case "rectangle": return { w: 300, h: 250 };
      default: return { w: 160, h: 600 }; // Vertical
    }
  };

  const { w, h } = getDimensions();

  useEffect(() => {
    if (iframeRef.current) {
      const adScript = `
        <html>
          <body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center;">
            <script type="text/javascript">
              atOptions = {
                'key' : '${slot}',
                'format' : 'iframe',
                'height' : ${h},
                'width' : ${w},
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="//://www.highperformanceformat.com{slot}/invoke.js"></script>
          </body>
        </html>
      `;
      iframeRef.current.srcdoc = adScript;
    }
  }, [slot, h, w]);

  return (
    <div className={`flex flex-col items-center my-4 ${className}`}>
      <iframe
        ref={iframeRef}
        width={w}
        height={h}
        frameBorder="0"
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden' }}
        title={`ad-${slot}`}
      />
      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter font-sans">Advertisement</p>
    </div>
  );
};

export default AdSlot;
