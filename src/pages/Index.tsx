import FloatingElements from "@/components/FloatingElements";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import NewsSection from "@/components/NewsSection";

import GallerySection from "@/components/GallerySection";
import FeedbackSection from "@/components/FeedbackSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-foreground/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] right-0 w-[500px] h-[500px] rounded-full bg-foreground/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 left-[30%] w-[700px] h-[400px] rounded-full bg-foreground/[0.02] blur-[150px]" />
      </div>

      <FloatingElements />
      <Navbar />
      <HeroSection />
      <div className="glow-line" />
      <AboutSection />
      <div className="glow-line" />
      <NewsSection />
      <div className="glow-line" />
      <GallerySection />
      <div className="glow-line" />
      <FeedbackSection />
      <Footer />
    </div>
  );
};

export default Index;

