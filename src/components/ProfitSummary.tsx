import { BarChart3 } from 'lucide-react';
import type { Event as NeekoEvent } from '../types';
import { completedEventMetrics, currency, percent } from '../utils/calculations';

interface ProfitSummaryProps {
  events: NeekoEvent[];
}

export default function ProfitSummary({ events }: ProfitSummaryProps) {
  const metrics = completedEventMetrics(events);

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Completed revenue" value={currency(metrics.revenue)} />
        <SummaryCard label="Actual profit" value={currency(metrics.profit)} accent="text-neeko-mint" />
        <SummaryCard label="Profit margin" value={percent(metrics.profitMargin)} />
        <SummaryCard label="Revenue per guest" value={currency(metrics.revenuePerGuest)} />
      </div>

      <div className="panel overflow-hidden p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-mint via-neeko-gold to-transparent" />
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-neeko-mint/25 bg-neeko-mint/10 text-neeko-mint">
            <BarChart3 size={18} />
          </span>
          <div>
            <p className="label">Performance</p>
            <h2 className="text-lg font-semibold text-stone-50">Completed event performance</h2>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {metrics.completed.map((event) => {
            const success = eventSuccessScore(event);
            const width = `${Math.max(success, 4)}%`;
            const margin = event.totalQuotedPrice > 0 ? event.actualProfit / event.totalQuotedPrice : 0;
            const tone = successTone(success);
            return (
              <div className="premium-row" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-stone-100">{event.eventName}</span>
                  <span className="text-stone-400">
                    {currency(event.actualProfit)} profit - {success}% success - {percent(margin)} margin
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.completed.map((event) => (
          <article className="panel overflow-hidden p-4" key={event.id}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-blue/70 via-neeko-mint/60 to-transparent" />
            <h3 className="text-lg font-semibold text-stone-50">{event.eventName}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Metric label="Revenue" value={currency(event.totalQuotedPrice)} />
              <Metric label="Actual cost" value={currency(event.actualCost)} />
              <Metric label="Cost per guest" value={currency(event.actualCost / event.guestCount)} />
              <Metric label="Profit" value={currency(event.actualProfit)} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-stone-400 sm:grid-cols-2">
              <div className="note-box">
                <p className="label">What went well</p>
                <p className="mt-2">Hero drink moved quickly, staff flow stayed clean, and the client asked for a retained menu.</p>
              </div>
              <div className="note-box">
                <p className="label">Improve next time</p>
                <p className="mt-2">Tighten ice ordering and prep garnish backup for the final service hour.</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, accent = 'text-stone-50' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="panel overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-mint/70 to-transparent" />
      <p className="label">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-100">{value}</p>
    </div>
  );
}

function eventSuccessScore(event: NeekoEvent) {
  if (event.totalQuotedPrice <= 0 || event.actualProfit <= 0) {
    return 4;
  }

  const margin = event.actualProfit / event.totalQuotedPrice;
  const marginScore = clamp((margin / 0.55) * 80, 0, 80);
  const costControlScore =
    event.estimatedCost > 0
      ? clamp(20 - Math.max((event.actualCost - event.estimatedCost) / event.estimatedCost, 0) * 80, 0, 20)
      : 10;

  return Math.round(clamp(marginScore + costControlScore, 4, 100));
}

function successTone(score: number) {
  if (score >= 75) return 'from-neeko-mint to-neeko-gold';
  if (score >= 45) return 'from-neeko-gold to-amber-300';
  return 'from-neeko-rose to-neeko-gold';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
