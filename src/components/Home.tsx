import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import { FeaturesGrid } from "./FeaturesGrid";
import { WorkflowTimeline } from "./WorkflowTimeline";
import { ShowcaseSection } from "./ShowcaseSection";
import { BenefitsSection } from "./BenefitsSection";
import { CTAFooter } from "./CTAFooter";

export function Home() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />

            <div id="hero_section">
                <HeroSection />
            </div>

            <div id="features">
                <FeaturesGrid />
            </div>

            <div id="how-it-works">
                <WorkflowTimeline />
            </div>

            <div id="showcase_section">
                <ShowcaseSection />
            </div>

            <div id="benefits">
                <BenefitsSection />
            </div>

            <div id="contact">
                <CTAFooter />
            </div>
        </div>
    );
}
