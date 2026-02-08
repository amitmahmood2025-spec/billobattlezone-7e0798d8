import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const switchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const switchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-display font-bold text-xl">
            <span className="text-foreground">BILLO</span>{" "}
            <span className="text-primary">BBZ</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Login
            </button>
            <button
              onClick={() => setRegisterOpen(true)}
              className="text-sm px-4 py-2 rounded-lg gradient-neon text-primary-foreground font-display font-semibold hover:scale-105 transition-transform"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      <HeroSection onLogin={() => setLoginOpen(true)} onRegister={() => setRegisterOpen(true)} />
      <FeaturesSection />
      <Footer />

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} onSwitchToRegister={switchToRegister} />
      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} onSwitchToLogin={switchToLogin} />
    </div>
  );
};

export default Index;
