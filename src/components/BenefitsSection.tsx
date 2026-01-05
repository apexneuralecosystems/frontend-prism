import { TrendingUp, Clock, CheckCircle2, Mail } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    stat: "80-85%",
    label: "Cuts manual HR tasks by 80–85%"
  },
  {
    icon: Clock,
    stat: "Seconds",
    label: "Delivers AI summaries in seconds"
  },
  {
    icon: CheckCircle2,
    stat: "Zero",
    label: "Zero missed follow-ups or slots"
  },
  {
    icon: Mail,
    stat: "All-in-One",
    label: "Works right from your email and calendar"
  }
];

export function BenefitsSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src="https://images.unsplash.com/photo-1665072204431-b3ba11bd6d06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzYwMDIyODYyfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Team collaboration"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-[1440px] mx-auto px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Stats & Benefits */}
          <div>
            <h2 className="text-[2.5rem] text-[#1E1E1E] mb-8" style={{ fontWeight: 700 }}>
              Real Impact on Your Hiring Process
            </h2>
            
            <div className="space-y-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-[#E6ECFF] rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-[#0052FF]" />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[2.5rem] text-[#0052FF] mb-2" style={{ fontWeight: 700 }}>
                        {benefit.stat}
                      </div>
                      <p className="text-[1.125rem] text-[#1E1E1E]" style={{ fontWeight: 500 }}>
                        {benefit.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Column - Visual Dashboard Mockup */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#0052FF] to-[#0040DD] rounded-2xl p-8 text-white shadow-2xl">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/20">
                  <h3 className="text-[1.5rem]" style={{ fontWeight: 600 }}>
                    Candidate Pipeline
                  </h3>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <p className="text-sm" style={{ fontWeight: 600 }}>Live Dashboard</p>
                  </div>
                </div>
                
                {/* Candidate Cards */}
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontWeight: 600 }}>Sarah Chen</p>
                      <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm" style={{ fontWeight: 600 }}>
                        98/100
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-3">
                      Senior Product Designer • 7 years exp.
                    </p>
                    <div className="flex gap-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs">AI Match</div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs">Ready</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontWeight: 600 }}>Marcus Johnson</p>
                      <span className="bg-blue-300 text-blue-900 px-3 py-1 rounded-full text-sm" style={{ fontWeight: 600 }}>
                        92/100
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-3">
                      Full-Stack Engineer • 5 years exp.
                    </p>
                    <div className="flex gap-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs">Scheduled</div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs">Tomorrow 2PM</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontWeight: 600 }}>Emily Rodriguez</p>
                      <span className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full text-sm" style={{ fontWeight: 600 }}>
                        88/100
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mb-3">
                      Data Scientist • 4 years exp.
                    </p>
                    <div className="flex gap-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs">In Review</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 border border-gray-100">
              <p className="text-[2rem] text-[#0052FF] mb-1" style={{ fontWeight: 700 }}>156</p>
              <p className="text-sm text-[#4A5568]">Hours Saved This Month</p>
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
