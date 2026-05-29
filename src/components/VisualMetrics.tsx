interface ProgressBarProps {
  value: number;
  max: number;
  tone?: 'mint' | 'gold' | 'rose' | 'blue';
}

const fillClasses = {
  mint: 'from-neeko-mint to-emerald-200',
  gold: 'from-neeko-gold to-amber-200',
  rose: 'from-neeko-rose to-red-200',
  blue: 'from-neeko-blue to-sky-200',
};

export function ProgressBar({ value, max, tone = 'mint' }: ProgressBarProps) {
  const width = `${Math.max(Math.min((value / Math.max(max, 1)) * 100, 100), 4)}%`;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
      <div className={`h-full rounded-full bg-gradient-to-r ${fillClasses[tone]}`} style={{ width }} />
    </div>
  );
}

export function DonutMetric({
  value,
  label,
  tone = 'mint',
}: {
  value: number;
  label: string;
  tone?: 'mint' | 'gold' | 'rose' | 'blue';
}) {
  const pct = Math.max(0, Math.min(value, 100));
  const color = tone === 'gold' ? '#e9bf72' : tone === 'rose' ? '#e48d8f' : tone === 'blue' ? '#7db7ff' : '#62d6ad';

  return (
    <div className="relative grid place-items-center">
      <div
        className="h-24 w-24 rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      />
      <div className="absolute grid h-[4.55rem] w-[4.55rem] place-items-center rounded-full border border-white/10 bg-ink-950/90 text-center">
        <span>
          <span className="block text-lg font-semibold text-stone-50">{pct}%</span>
          <span className="block text-[0.62rem] uppercase tracking-[0.08em] text-stone-500">{label}</span>
        </span>
      </div>
    </div>
  );
}
