interface StatusBadgeProps {
  label: string;
  tone?: 'green' | 'gold' | 'rose' | 'blue' | 'neutral';
}

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  green: 'border-neeko-mint/30 bg-neeko-mint/10 text-neeko-mint',
  gold: 'border-neeko-gold/[0.35] bg-neeko-gold/10 text-neeko-gold',
  rose: 'border-neeko-rose/[0.35] bg-neeko-rose/10 text-neeko-rose',
  blue: 'border-neeko-blue/[0.35] bg-neeko-blue/10 text-neeko-blue',
  neutral: 'border-white/[0.12] bg-white/[0.07] text-stone-300',
};

export function statusTone(status: string): NonNullable<StatusBadgeProps['tone']> {
  if (['booked', 'completed', 'paid', 'responded'].includes(status)) return 'green';
  if (['quoted', 'quote sent', 'deposit paid', 'meeting booked', 'follow up later'].includes(status)) return 'gold';
  if (['canceled', 'lost', 'unpaid'].includes(status)) return 'rose';
  if (['inquiry', 'new', 'reached out'].includes(status)) return 'blue';
  return 'neutral';
}

export default function StatusBadge({ label, tone = statusTone(label) }: StatusBadgeProps) {
  return <span className={`status-pill ${toneClasses[tone]}`}>{label}</span>;
}
