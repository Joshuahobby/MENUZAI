import { useMenu } from "@/context/MenuContext";

const DENSITY_VALUES: Array<"compact" | "comfortable" | "spacious"> = ["compact", "comfortable", "spacious"];
const DENSITY_LABELS: Record<string, string> = { compact: "Compact", comfortable: "Relaxed", spacious: "Spacious" };

const PRESETS: Array<{ label: string; style: Parameters<ReturnType<typeof useMenu>["applyTemplate"]>[0] }> = [
  { label: "Editorial", style: { primaryColor: "#1E1E1E", headlineFont: "Playfair Display", bodyFont: "Inter", borderRadius: "0.5rem", layoutDensity: "comfortable" } },
  { label: "Minimal", style: { primaryColor: "#0070F3", headlineFont: "Plus Jakarta Sans", bodyFont: "Inter", borderRadius: "1rem", layoutDensity: "compact" } },
];

export function StyleEditorSidebar() {
  const { menuStyle, setMenuStyle, applyTemplate } = useMenu();

  const densityIndex = DENSITY_VALUES.indexOf(menuStyle.layoutDensity);

  return (
    <aside className="w-72 bg-surface flex flex-col p-6 overflow-y-auto shrink-0 hidden xl:flex">
      <div className="mb-8">
        <h2 className="font-[var(--font-headline)] text-lg font-bold tracking-tight mb-2">Style Editor</h2>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Global Brand Identity</p>
      </div>
      <div className="space-y-8">
        {/* Typography */}
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Typography</label>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="headline-font">Headlines</label>
              <select 
                id="headline-font" 
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={menuStyle.headlineFont}
                onChange={(e) => setMenuStyle({ ...menuStyle, headlineFont: e.target.value })}
                title="Select Headline Typography" aria-label="Select Headline Typography"
              >
                <option>Plus Jakarta Sans</option>
                <option>Poppins</option>
                <option>Playfair Display</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block" htmlFor="body-font">Body Text</label>
              <select 
                id="body-font" 
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={menuStyle.bodyFont}
                onChange={(e) => setMenuStyle({ ...menuStyle, bodyFont: e.target.value })}
                title="Select Body Typography" aria-label="Select Body Typography"
              >
                <option>Inter</option>
                <option>Montserrat</option>
                <option>Open Sans</option>
              </select>
            </div>
          </div>
        </div>
        {/* Colors */}
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Color Palette</label>
          <div className="grid grid-cols-5 gap-3">
            {[
              { name: "Orange", hex: "#FF6B00" },
              { name: "Black", hex: "#1E1E1E" },
              { name: "Green", hex: "#00C853" },
              { name: "Blue", hex: "#0070F3" },
              { name: "Purple", hex: "#7928CA" }
            ].map((color) => {
              const isActive = menuStyle.primaryColor === color.hex;
              const bgColorClass = 
                  color.hex === "#FF6B00" ? "bg-[#FF6B00]" :
                  color.hex === "#1E1E1E" ? "bg-[#1E1E1E]" :
                  color.hex === "#00C853" ? "bg-[#00C853]" :
                  color.hex === "#0070F3" ? "bg-[#0070F3]" :
                  "bg-[#7928CA]";

              return (
                <button 
                  key={color.hex}
                  className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${isActive ? "ring-4 ring-primary/20 ring-offset-2 scale-110" : "hover:scale-110"} ${bgColorClass}`}
                  onClick={() => setMenuStyle({ ...menuStyle, primaryColor: color.hex })}
                  title={color.name}
                  aria-label={color.name}
                >
                  {isActive && <span className="material-symbols-outlined text-white text-xs">check</span>}
                </button>
              );
            })}
          </div>
        </div>
        {/* Presets — M1: wired */}
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Style Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isActive = menuStyle.headlineFont === preset.style.headlineFont && menuStyle.layoutDensity === preset.style.layoutDensity;
              return (
                <button
                  key={preset.label}
                  onClick={() => applyTemplate(preset.style)}
                  className={`h-12 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all border-2 ${isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container-high"}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Layout — M1: wired to layoutDensity */}
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">Layout Grid</label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setMenuStyle({ ...menuStyle, layoutDensity: "comfortable" })}
              className={`p-3 rounded-xl flex flex-col items-center gap-2 cursor-pointer border-2 transition-all ${menuStyle.layoutDensity === "comfortable" ? "bg-surface-container-high border-primary" : "bg-surface-container-low border-transparent hover:bg-surface-container-high"}`}
            >
              <span className={`material-symbols-outlined ${menuStyle.layoutDensity === "comfortable" ? "text-primary" : "text-secondary"}`}>view_stream</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Single Column</span>
            </div>
            <div
              onClick={() => setMenuStyle({ ...menuStyle, layoutDensity: "compact" })}
              className={`p-3 rounded-xl flex flex-col items-center gap-2 cursor-pointer border-2 transition-all ${menuStyle.layoutDensity === "compact" ? "bg-surface-container-high border-primary" : "bg-surface-container-low border-transparent hover:bg-surface-container-high"}`}
            >
              <span className={`material-symbols-outlined ${menuStyle.layoutDensity === "compact" ? "text-primary" : "text-secondary"}`}>view_module</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Two Column</span>
            </div>
          </div>
        </div>
        {/* Density Slider — M1: wired */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-[0.2em]" htmlFor="density-slider">Density</label>
            <span className="text-xs font-bold text-primary">{DENSITY_LABELS[menuStyle.layoutDensity]}</span>
          </div>
          <input
            id="density-slider"
            type="range"
            min={0}
            max={2}
            step={1}
            value={densityIndex === -1 ? 1 : densityIndex}
            onChange={(e) => setMenuStyle({ ...menuStyle, layoutDensity: DENSITY_VALUES[parseInt(e.target.value)] })}
            className="w-full h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
            title="Layout Density" aria-label="Layout Density"
          />
        </div>
      </div>
    </aside>
  );
}