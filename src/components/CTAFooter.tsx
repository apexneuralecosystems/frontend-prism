import { useState } from "react";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";

export function CTAFooter() {
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient Background - CTA Section Only */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0040FF 0%, #0020A0 100%)',
          paddingTop: '4.8rem',
          paddingBottom: '4.8rem'
        }}
      >
        <div className="max-w-[1440px] mx-auto px-20 text-center relative z-10">
          <h2 className="text-white mb-5" style={{ fontWeight: 700, fontSize: '2.4rem' }}>
            Ready to see PRISM in action?
          </h2>
          
          <p className="text-white/90 mb-3 max-w-3xl mx-auto" style={{ fontSize: '1rem' }}>
            Experience how PRISM automates your entire recruitment workflow with intelligent AI summaries and smart scheduling.
          </p>
          
          <p className="text-white/70 mb-8 max-w-2xl mx-auto italic" style={{ fontSize: '0.76rem' }}>
            Precision Recruitment Intelligence & Selection Mechanism
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              className="bg-[#FF6B4A] text-white hover:bg-[#FF5535] rounded-lg px-8 py-6 h-auto shadow-xl"
              style={{ fontWeight: 600, fontSize: '0.9rem' }}
              onClick={() => setIsDemoFormOpen(true)}
            >
              Book a Demo
            </Button>
            
            <Button 
              className="bg-white text-[#0052FF] hover:bg-gray-100 rounded-lg px-8 py-6 h-auto shadow-xl"
              style={{ fontWeight: 600, fontSize: '0.9rem' }}
              asChild
            >
              <a 
                href="https://calendly.com/anshul-jain-apexneural/ai-strategy-intro-call-with-anshul-jain?utm_source=schedule_from_linkedin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Sales
              </a>
            </Button>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
      </div>
      
      {/* Footer Bottom - Separate from gradient, fixed at bottom */}
      <div 
        className="w-full"
        style={{ 
          background: 'linear-gradient(135deg, #0040FF 0%, #0020A0 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '1rem 0'
        }}
      >
        <div className="max-w-[1440px] mx-auto px-20 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontWeight: 700 }}>A</span>
              </div>
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 600, lineHeight: '1.2' }}>
                  ApexNeural
                </p>
                <p className="text-white/60 text-xs" style={{ lineHeight: '1.2' }}>
                  AI-Powered Recruitment Solutions
                </p>
              </div>
            </div>
            
            <p className="text-white/70 text-sm" style={{ lineHeight: '1.2' }}>
              © 2025 ApexNeural. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6 text-sm text-white/70">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
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
    </footer>
  );
}
