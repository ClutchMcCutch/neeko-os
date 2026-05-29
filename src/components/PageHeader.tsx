import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  stats?: { label: string; value: string; tone?: 'mint' | 'gold' | 'rose' | 'blue' }[];
}

const toneClasses = {
  mint: 'text-neeko-mint',
  gold: 'text-neeko-gold',
  rose: 'text-neeko-rose',
  blue: 'text-neeko-blue',
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  actions,
  stats = [],
}: PageHeaderProps) {
  return (
    <section className="panel overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-mint via-neeko-gold to-neeko-blue" />
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-45 [background-image:linear-gradient(135deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md border border-neeko-mint/25 bg-neeko-mint/[0.12] text-neeko-mint">
              <Icon size={20} />
            </span>
            <p className="label">{eyebrow}</p>
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">{description}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {stats.length ? (
            <div className="grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div className="rounded-md border border-white/10 bg-ink-950/45 px-3 py-2" key={stat.label}>
                  <p className="text-[0.68rem] uppercase tracking-[0.08em] text-stone-500">{stat.label}</p>
                  <p className={`mt-1 text-lg font-semibold ${toneClasses[stat.tone ?? 'mint']}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
