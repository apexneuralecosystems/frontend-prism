import { 
  Brain, 
  BarChart3, 
  Lightbulb, 
  Calendar, 
  MessageSquare, 
  Zap 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Understanding",
    subtitle: "Reads resumes and builds instant summaries."
  },
  {
    icon: BarChart3,
    title: "Comparison Intelligence",
    subtitle: "Benchmarks candidates against top employees."
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    subtitle: "Suggests best-fit roles and scores."
  },
  {
    icon: Calendar,
    title: "Automated Scheduling",
    subtitle: "Manages interview slots and calendar updates."
  },
  {
    icon: MessageSquare,
    title: "AI-Driven Feedback Insights",
    subtitle: "Summarizes panel feedback into quick notes."
  },
  {
    icon: Zap,
    title: "End-to-End Automation",
    subtitle: "From resume to offer with no manual follow-up."
  }
];

export function FeaturesGrid() {
  return (
    <section className="py-20 bg-white relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5">
        <img 
          src="https://images.unsplash.com/photo-1731846584223-81977e156b2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzYwMDg3ODUwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="AI Technology"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-[1440px] mx-auto px-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] text-[#1E1E1E] mb-4" style={{ fontWeight: 700 }}>
            Everything You Need to Automate Hiring
          </h2>
          <p className="text-[1.125rem] text-[#4A5568] max-w-2xl mx-auto">
            AI-powered features that transform your recruitment workflow from end to end
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 border border-gray-100 hover:border-[#0052FF]/30 transition-all duration-300 hover:shadow-xl"
                style={{
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-[#E6ECFF] rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#0052FF]" />
                  </div>
                </div>
                
                <h3 className="text-[1.25rem] text-[#1E1E1E] mb-3" style={{ fontWeight: 600 }}>
                  {feature.title}
                </h3>
                
                <p className="text-[#4A5568]">
                  {feature.subtitle}
                </p>
              </div>
            );
          })}
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
