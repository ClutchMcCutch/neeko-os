import { ReceiptText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import QuoteCalculator from '../components/QuoteCalculator';
import type { Drink, Event as NeekoEvent, Quote } from '../types';
import { currency, percent } from '../utils/calculations';

interface QuotesPageProps {
  drinks: Drink[];
  events: NeekoEvent[];
  quotes: Quote[];
  onSaveQuote: (quote: Quote) => void;
}

export default function QuotesPage({ drinks, events, quotes, onSaveQuote }: QuotesPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Quote Generator"
        title="Live pricing and saved options"
        description="Model demand, ingredient cost, staffing, supplies, add-ons, and target margin before saving pricing back to an event."
        icon={ReceiptText}
        stats={[
          { label: 'Quotes', value: `${quotes.length}`, tone: 'blue' },
          { label: 'Avg price', value: currency(quotes.reduce((sum, quote) => sum + quote.calculated.standardPrice, 0) / Math.max(quotes.length, 1)), tone: 'mint' },
          { label: 'Avg margin', value: percent(quotes.reduce((sum, quote) => sum + quote.calculated.profitMargin, 0) / Math.max(quotes.length, 1)), tone: 'gold' },
        ]}
      />
      <QuoteCalculator drinks={drinks} events={events} onSave={onSaveQuote} />
      <section className="panel overflow-hidden p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-blue/70 via-neeko-mint/50 to-transparent" />
        <div className="section-heading">
          <div>
            <p className="label">Saved quotes</p>
            <h2 className="text-lg font-semibold text-stone-50">Reusable pricing history</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {quotes.map((quote) => {
            const event = events.find((item) => item.id === quote.eventId);
            return (
              <article className="premium-row" key={quote.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-stone-50">{quote.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">{event?.eventName ?? 'No event attached'}</p>
                  </div>
                  <p className="text-xl font-semibold text-neeko-mint">{currency(quote.calculated.standardPrice)}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Metric label="Guests" value={`${quote.guestCount}`} />
                  <Metric label="Volume" value={`${quote.calculated.estimatedDrinkVolume}`} />
                  <Metric label="Cost" value={currency(quote.calculated.totalEstimatedCost)} />
                  <Metric label="Margin" value={percent(quote.calculated.profitMargin)} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
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
