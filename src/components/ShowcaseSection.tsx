import { CheckCircle2 } from "lucide-react";

const highlights = [
  "Analyze 100+ resumes in minutes",
  "AI-powered candidate matching",
  "Automated interview scheduling",
  "Real-time collaboration tools"
];

export function ShowcaseSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#F8FAFC] to-white">
      <div className="max-w-[1440px] mx-auto px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1630283017802-785b7aff9aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYwMDc2ODkzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern Workspace with PRISM"
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0052FF] to-[#00A3FF] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-[1.75rem] text-[#0052FF]" style={{ fontWeight: 700 }}>99.2%</p>
                  <p className="text-sm text-[#4A5568]">Accuracy Rate</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right - Content */}
          <div className="space-y-6">
            <div className="inline-block bg-[#E6ECFF] text-[#0052FF] px-4 py-2 rounded-full text-sm" style={{ fontWeight: 600 }}>
              Trusted by Leading Companies
            </div>
            
            <h2 className="text-[2.5rem] text-[#1E1E1E]" style={{ fontWeight: 700 }}>
              Transform Your Recruitment Process with PRISM
            </h2>
            
            <p className="text-[1.125rem] text-[#4A5568] leading-relaxed">
              Join hundreds of companies using ApexNeural's PRISM platform — Precision Recruitment Intelligence & Selection Mechanism — to make data-driven hiring decisions faster and more accurately.
            </p>
            
            <div className="space-y-4 pt-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#0052FF] rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[1rem] text-[#1E1E1E]" style={{ fontWeight: 500 }}>
                    {highlight}
                  </p>
                </div>
              ))}
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
    </section>
  );
}
