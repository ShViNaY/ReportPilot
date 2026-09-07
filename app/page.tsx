import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { PlatformSection } from '@/components/landing/PlatformSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900 relative">
      {/* Top Navbar */}
      <LandingHeader />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Product Dashboard Preview */}
        <ProductPreview />

        {/* Supported Platforms / Trust Section */}
        <PlatformSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}