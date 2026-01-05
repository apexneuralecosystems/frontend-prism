import { Mail, Brain, Calendar, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Mail,
    title: "Collects & Reads",
    description: "AI captures details from emails instantly.",
    color: "#0052FF"
  },
  {
    icon: Brain,
    title: "Analyzes & Summarizes",
    description: "AI writes smart HR-ready insights.",
    color: "#0052FF"
  },
  {
    icon: Calendar,
    title: "Schedules Automatically",
    description: "Manages availability & confirms meetings.",
    color: "#0052FF"
  },
  {
    icon: CheckCircle,
    title: "Tracks & Decides",
    description: "AI suggests next actions based on feedback.",
    color: "#0052FF"
  }
];

export function WorkflowTimeline() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-20">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] text-[#1E1E1E] mb-4" style={{ fontWeight: 700 }}>
            How PRISM Works
          </h2>
          <p className="text-[1.125rem] text-[#4A5568] max-w-2xl mx-auto">
            Four simple steps to transform your hiring process
          </p>
        </div>
        
        {/* Timeline */}
        <div className="relative">
          {/* Connector Line - Desktop */}
          <div className="hidden lg:block absolute top-[4rem] left-0 right-0 h-1 mx-auto" style={{ maxWidth: 'calc(100% - 16rem)' }}>
            <div 
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #0052FF 0%, #00A3FF 100%)',
                marginLeft: '8rem'
              }}
            />
          </div>
          
          {/* Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center relative">
                  {/* Icon Circle */}
                  <div className="mb-6 flex justify-center">
                    <div 
                      className="w-32 h-32 rounded-full flex items-center justify-center bg-white border-4 relative z-10"
                      style={{
                        borderColor: step.color,
                        boxShadow: '0 8px 24px rgba(0, 82, 255, 0.2)'
                      }}
                    >
                      <Icon className="w-12 h-12" style={{ color: step.color }} />
                    </div>
                  </div>
                  
                  {/* Step Number */}
                  <div className="mb-3">
                    <span 
                      className="inline-block w-8 h-8 rounded-full text-white flex items-center justify-center text-sm"
                      style={{ 
                        backgroundColor: step.color,
                        fontWeight: 600
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-[1.25rem] text-[#1E1E1E] mb-3" style={{ fontWeight: 600 }}>
                    {step.title}
                  </h3>
                  
                  <p className="text-[#4A5568]">
                    {step.description}
                  </p>
                </div>
              );
            })}
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
