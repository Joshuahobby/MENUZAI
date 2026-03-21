import Image from "next/image";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface overflow-x-hidden">
      {/* Top Nav */}
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">MENUZA AI</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-secondary">Need help?</span>
          <span className="material-symbols-outlined text-secondary hover:text-primary transition-colors cursor-pointer">help</span>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12 lg:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left Column: Visual */}
          <div className="relative aspect-video lg:aspect-square bg-surface-container-low rounded-[3rem] overflow-hidden shadow-2xl border border-white/50">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 bg-surface-container-lowest p-4 rounded-[2.5rem] shadow-2xl shadow-on-surface/5 rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden">
              <div className="relative w-full h-[450px]">
                <Image
                  alt="Restaurant owner managing digital menu"
                  className="rounded-[2rem] object-cover"
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute bottom-10 -right-6 bg-surface-container-lowest p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-outline-variant/10 max-w-[240px] z-20">
                <div className="w-12 h-12 bg-tertiary-container/20 rounded-xl flex items-center justify-center text-tertiary font-[var(--font-headline)]">
                  <span className="material-symbols-outlined icon-fill">check_circle</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">AI Status</p>
                  <p className="text-sm font-semibold text-on-surface">Menu optimized</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="flex flex-col space-y-10 order-1 lg:order-2">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-xs font-bold tracking-tight uppercase">
                Coming from paper? We got you.
              </div>
              <h1 className="text-5xl lg:text-7xl font-[var(--font-headline)] font-extrabold tracking-tighter text-on-surface leading-[1.1]">
                Create your smart menu in <span className="text-primary">60 seconds.</span>
              </h1>
              <p className="text-xl text-secondary max-w-lg leading-relaxed">
                Upload your current menu and let our AI do the heavy lifting. Categorization, descriptions, and pricing—all automated for your restaurant.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <Link href="/upload" className="group relative flex flex-col items-start p-8 bg-gradient-to-br from-primary to-primary-container rounded-[2rem] text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <h3 className="text-2xl font-[var(--font-headline)] font-bold text-white mb-2">Upload Menu</h3>
                <p className="text-white/80 text-sm leading-snug">Drag and drop your PDF or take a photo of your physical menu.</p>
                <div className="mt-8 flex items-center gap-2 text-white font-bold text-sm">
                  Get Started
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </Link>

              <Link href="/dashboard/templates" className="group relative flex flex-col items-start p-8 bg-surface-container-low rounded-[2rem] text-left transition-all duration-300 hover:bg-surface-container-high hover:scale-[1.02] active:scale-95 border border-outline-variant/5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-3xl">dashboard_customize</span>
                </div>
                <h3 className="text-2xl font-[var(--font-headline)] font-bold text-on-surface mb-2">Start from Template</h3>
                <p className="text-secondary text-sm leading-snug">Choose from 50+ professionally designed restaurant layouts.</p>
                <div className="mt-8 flex items-center gap-2 text-primary font-bold text-sm">
                  Browse Gallery
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">auto_awesome</span>
                </div>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-outline-variant/10 flex flex-wrap gap-8 items-center">
              <p className="text-sm font-medium text-secondary/60">Trusted by modern venues:</p>
              <div className="flex gap-6 grayscale opacity-40">
                <span className="font-[var(--font-headline)] font-black text-lg tracking-tighter">BISTRO.IO</span>
                <span className="font-[var(--font-headline)] font-black text-lg tracking-tighter">LUXE CAFE</span>
                <span className="font-[var(--font-headline)] font-black text-lg tracking-tighter">FORK &amp; KNIFE</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 w-1/3 h-screen bg-gradient-to-l from-primary-fixed/20 to-transparent pointer-events-none"></div>
    </div>
  );
}
