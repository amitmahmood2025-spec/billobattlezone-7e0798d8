interface AdSlotProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

/**
 * Ad placeholder component. Replace with actual ad network scripts.
 * 
 * Usage:
 *   <AdSlot slot="top-banner" format="horizontal" />
 *   <AdSlot slot="sidebar" format="rectangle" />
 * 
 * To implement real ads:
 * 1. Google AdSense: Add script in index.html, use data-ad-client/data-ad-slot
 * 2. AdSterra: Replace with their script tag
 * 3. Monetag: Replace with their script tag
 * 4. Custom: Admin can upload banners via admin panel
 */
const AdSlot = ({ slot, format = "auto", className = "" }: AdSlotProps) => {
  return (
    <div
      className={`w-full flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border/50 overflow-hidden ${className}`}
      data-ad-slot={slot}
      data-ad-format={format}
      style={{
        minHeight: format === "horizontal" ? 90 : format === "rectangle" ? 250 : 100,
      }}
    >
      {/* Replace this div with actual ad script */}
      <p className="text-xs text-muted-foreground/50 select-none">AD — {slot}</p>
    </div>
  );
};

export default AdSlot;
