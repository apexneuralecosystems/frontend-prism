import { useState } from "react";
import { Button } from "./ui/button";
import { Play } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { DemoRequestForm } from "./DemoRequestForm";

export function HeroSection() {
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(135deg, #E6ECFF 0%, #FFFFFF 100%)'
        }}
      />
      
      <div className="relative max-w-[1440px] mx-auto px-20 py-20 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <div className="mb-4">
              <p className="text-sm text-[#4A5568] mb-2" style={{ fontWeight: 500 }}>
                BY APEXNEURAL
              </p>
              <h1 className="text-[3.5rem] leading-[1.15] text-[#1E1E1E]" style={{ fontWeight: 700 }}>
                PRISM
              </h1>
              <p className="text-[1.125rem] text-[#0052FF] mt-2" style={{ fontWeight: 600 }}>
                Precision Recruitment Intelligence & Selection Mechanism
              </p>
            </div>
            
            <p className="text-[1.5rem] text-[#1E1E1E] leading-tight max-w-xl mb-4" style={{ fontWeight: 600 }}>
              Hire Smarter. Decide Faster. Powered by AI.
            </p>
            
            <p className="text-[1.125rem] text-[#4A5568] leading-relaxed max-w-xl">
              PRISM analyzes resumes, compares them with your best employees, and delivers smart AI-written summaries that help HRs make confident decisions — reducing manual work by 80–85%.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                className="bg-[#0052FF] hover:bg-[#0046DD] text-white rounded-lg px-8 py-6 h-auto"
                onClick={() => setIsDemoFormOpen(true)}
              >
                Request Demo
              </Button>
              
              <Button 
                variant="outline" 
                className="border-[#0052FF] text-[#0052FF] hover:bg-[#E6ECFF] rounded-lg px-8 py-6 h-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch PRISM in Action
              </Button>
            </div>
          </div>
          
          {/* Right Column - AI Dashboard Preview */}
          <div className="relative pl-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative overflow-visible">
              {/* AI Summary Card */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[1.25rem] text-[#1E1E1E]" style={{ fontWeight: 600 }}>
                    AI Analysis Summary
                  </h3>
                  <div className="bg-[#0052FF] text-white px-4 py-2 rounded-full text-sm" style={{ fontWeight: 600 }}>
                    Score: 94/100
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#F0F5FF] border border-[#0052FF]/20 rounded-lg p-4">
                    <p className="text-sm text-[#1E1E1E] mb-2" style={{ fontWeight: 600 }}>
                      ✓ Strong Technical Match
                    </p>
                    <p className="text-sm text-[#4A5568]">
                      Candidate shows excellent alignment with senior engineers in your team
                    </p>
                  </div>
                  
                  <div className="bg-[#FFF5F0] border border-[#FF6B4A]/20 rounded-lg p-4">
                    <p className="text-sm text-[#1E1E1E] mb-2" style={{ fontWeight: 600 }}>
                      → Decision Hint
                    </p>
                    <p className="text-sm text-[#4A5568]">
                      Recommended for immediate interview. Top 5% match this quarter.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-[1.5rem] text-[#0052FF]" style={{ fontWeight: 700 }}>8</p>
                      <p className="text-xs text-[#4A5568]">Years Exp.</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-[1.5rem] text-[#0052FF]" style={{ fontWeight: 700 }}>12</p>
                      <p className="text-xs text-[#4A5568]">Skills Match</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-[1.5rem] text-[#0052FF]" style={{ fontWeight: 700 }}>A+</p>
                      <p className="text-xs text-[#4A5568]">Culture Fit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[#FF6B4A] to-[#FF5535] text-white px-6 py-3 rounded-full shadow-xl z-20">
              <p className="text-sm" style={{ fontWeight: 600 }}>✨ AI Powered</p>
            </div>
          </div>
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
      <DemoRequestForm open={isDemoFormOpen} onOpenChange={setIsDemoFormOpen} />
    </section>
  );
}
