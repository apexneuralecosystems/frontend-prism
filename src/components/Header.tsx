import { Button } from "./ui/button";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-20 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* ApexNeural Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-[#0052FF] to-[#00A3FF] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontWeight: 700, fontSize: '1.25rem' }}>A</span>
              </div>
              <div>
                <p className="text-[1.125rem] text-[#1E1E1E]" style={{ fontWeight: 700 }}>
                  ApexNeural
                </p>
                <p className="text-xs text-[#0052FF]" style={{ fontWeight: 600 }}>
                  PRISM Platform
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#4A5568] hover:text-[#0052FF] transition-colors" style={{ fontWeight: 500 }}>
              Features
            </a>
            <a href="#how-it-works" className="text-[#4A5568] hover:text-[#0052FF] transition-colors" style={{ fontWeight: 500 }}>
              How It Works
            </a>
            <a href="#benefits" className="text-[#4A5568] hover:text-[#0052FF] transition-colors" style={{ fontWeight: 500 }}>
              Benefits
            </a>
            <a href="#contact" className="text-[#4A5568] hover:text-[#0052FF] transition-colors" style={{ fontWeight: 500 }}>
              Contact
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              className="border-[#0052FF] text-[#0052FF] hover:bg-[#E6ECFF]"
              onClick={() => window.location.href = '/auth'}
            >
              Sign In
            </Button>
            <Button
              className="bg-[#0052FF] text-white hover:bg-[#0046DD]"
              onClick={() => window.location.href = '/auth'}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2">
            <Menu className="w-6 h-6 text-[#1E1E1E]" />
          </button>
        </div>
      </div>

      {/* Mobile Responsive Adjustments */}
      <style>{`
        @media (max-width: 1024px) {
          .max-w-\\[1440px\\] {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `}</style>
    </header>
  );
}
