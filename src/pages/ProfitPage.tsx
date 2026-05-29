import { BarChart3 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfitSummary from '../components/ProfitSummary';
import type { Event as NeekoEvent } from '../types';
import { completedEventMetrics, currency, percent } from '../utils/calculations';

interface ProfitPageProps {
  events: NeekoEvent[];
}

export default function ProfitPage({ events }: ProfitPageProps) {
  const metrics = completedEventMetrics(events);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Profit Tracker"
        title="Completed event profitability"
        description="Review revenue, actual cost, profit, margin, and lessons from events that have already closed."
        icon={BarChart3}
        stats={[
          { label: 'Revenue', value: currency(metrics.revenue), tone: 'mint' },
          { label: 'Profit', value: currency(metrics.profit), tone: 'gold' },
          { label: 'Margin', value: percent(metrics.profitMargin), tone: 'blue' },
        ]}
      />
      <ProfitSummary events={events} />
    </div>
  );
}
