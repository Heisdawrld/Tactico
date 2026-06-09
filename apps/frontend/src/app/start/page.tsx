import ClubSelector from "@/components/ClubSelector";

export default function StartPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-midnight to-charcoal" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(30,41,59,0.5),transparent_50%)]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 animate-fade-in-up">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-400 flex items-center justify-center shadow-gold-glow">
              <span className="text-charcoal font-black text-xl">T</span>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3">
            <span className="gradient-text">TACTICO</span>
          </h1>
          <p className="text-offwhite-500 text-sm uppercase tracking-[0.2em] font-medium">
            The Football Intelligence
          </p>
          <div className="mt-4 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <ClubSelector />
      </div>
    </div>
  );
}
