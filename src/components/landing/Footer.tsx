const Footer = () => (
  <footer className="border-t border-border py-8 px-4">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="font-display font-bold text-lg">
        <span className="text-foreground">BILLO</span>{" "}
        <span className="text-primary">BATTLE ZONE</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 Billo Battle Zone. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
