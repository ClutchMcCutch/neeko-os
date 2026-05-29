import type { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value?: string;
  detail?: string;
  icon?: ReactNode;
  accent?: 'mint' | 'gold' | 'rose' | 'blue';
  children?: ReactNode;
}

const accentClasses = {
  mint: {
    icon: 'text-neeko-mint bg-neeko-mint/10 border-neeko-mint/20',
    rule: 'from-neeko-mint',
    glow: 'shadow-[0_0_34px_rgba(98,214,173,0.14)]',
  },
  gold: {
    icon: 'text-neeko-gold bg-neeko-gold/10 border-neeko-gold/20',
    rule: 'from-neeko-gold',
    glow: 'shadow-[0_0_34px_rgba(233,191,114,0.12)]',
  },
  rose: {
    icon: 'text-neeko-rose bg-neeko-rose/10 border-neeko-rose/20',
    rule: 'from-neeko-rose',
    glow: 'shadow-[0_0_34px_rgba(228,141,143,0.12)]',
  },
  blue: {
    icon: 'text-neeko-blue bg-neeko-blue/10 border-neeko-blue/20',
    rule: 'from-neeko-blue',
    glow: 'shadow-[0_0_34px_rgba(125,183,255,0.12)]',
  },
};

export default function DashboardCard({
  title,
  value,
  detail,
  icon,
  accent = 'mint',
  children,
}: DashboardCardProps) {
  const accentClass = accentClasses[accent];

  return (
    <section className={`panel overflow-hidden p-4 ${accentClass.glow}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClass.rule} to-transparent`} />
      <div className="absolute -right-8 top-5 h-24 w-24 rotate-45 border border-white/[0.06]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label">{title}</p>
          {value ? <p className="mt-3 text-3xl font-semibold leading-none text-stone-50">{value}</p> : null}
          {detail ? <p className="mt-1 text-sm text-stone-400">{detail}</p> : null}
        </div>
        {icon ? (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${accentClass.icon}`}>
            {icon}
          </div>
        ) : null}
      </div>
      {children ? <div className="relative mt-4">{children}</div> : null}
    </section>
  );
}
