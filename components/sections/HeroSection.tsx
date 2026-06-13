"use client";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen">
      <div className="relative min-h-screen flex items-center">
        {/* Left: text */}
        <div className="flex-1 px-6 md:px-16 lg:px-28" style={{ maxWidth: "720px", marginLeft: "6rem" }}>
          <h1 className="neue-machina mb-6" style={{ fontSize: "clamp(2.4rem, 4.8vw, 5.5rem)", lineHeight: 1, background: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #0055FF 70%, #00D4FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Building Tomorrow's Technology for Today's World
          </h1>

          <p className="font-semibold mb-6 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.88)" }}>
            Empowering The Future Through Technology
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#about-mds" className="px-7 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-105 hover:brightness-110" style={{ background: "linear-gradient(135deg, #0055FF, #00D4FF)", boxShadow: "0 0 28px rgba(0,85,255,0.44), 0 0 60px rgba(0,180,255,0.12)" }}>
              Explore MDS
            </a>
            <a href="#noorva" className="px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-300" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.75)" }}>
              Discover Noorva
            </a>
          </div>
        </div>

        {/* Right: image */}
        <div className="hidden md:block" style={{ width: "clamp(220px, 35vw, 600px)", height: "clamp(70vh, 90vh, 100%)" }}>
          <div className="relative w-full h-full overflow-hidden rounded-l-[36px]" style={{ boxShadow: "-60px 0 100px rgba(0,0,0,0.32)" }}>
            <img src="/rightimage.jpeg" alt="Hero side image" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center', display: 'block' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
