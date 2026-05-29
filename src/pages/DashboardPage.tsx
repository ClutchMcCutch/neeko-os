import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Gauge,
  ListChecks,
  Martini,
  PackagePlus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import DashboardCard from '../components/DashboardCard';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { DonutMetric, ProgressBar } from '../components/VisualMetrics';
import type { AppData } from '../types';
import {
  currency,
  defaultDrinksPerGuest,
  eventDurationHours,
  formatNumber,
  lowInventoryItems,
  monthlyEventTotals,
  percent,
} from '../utils/calculations';

interface DashboardPageProps {
  data: AppData;
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ data, onNavigate }: DashboardPageProps) {
  const today = new Date();
  const upcomingEvents = data.events
    .filter((event) => new Date(`${event.date}T12:00:00`) >= today && event.status !== 'canceled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const lowStock = lowInventoryItems(data.inventory).slice(0, 5);
  const activeLeads = data.leads.filter((lead) => !['booked', 'lost'].includes(lead.status));
  const followUps = activeLeads
    .filter((lead) => lead.nextFollowUpDate)
    .sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate))
    .slice(0, 4);
  const monthly = monthlyEventTotals(data.events, today);
  const prepEvents = upcomingEvents.filter((event) => event.status === 'booked').slice(0, 3);
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + lead.potentialEventValue, 0);
  const maxEventRevenue = Math.max(...data.events.map((event) => event.totalQuotedPrice), 1);
  const monthlyMargin = monthly.revenue > 0 ? monthly.estimatedProfit / monthly.revenue : 0;
  const bookedEvents = data.events.filter((event) => ['booked', 'completed'].includes(event.status)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Command Center"
        title="Run Neeko from first inquiry to final pour."
        description="A live operating view for revenue, prep pressure, inventory risk, event readiness, and relationship follow-through."
        icon={Gauge}
        stats={[
          { label: 'Pipeline', value: currency(pipelineValue), tone: 'gold' },
          { label: 'Booked', value: `${bookedEvents}`, tone: 'mint' },
          { label: 'Margin', value: percent(monthlyMargin), tone: 'blue' },
        ]}
        actions={
          <>
            <button className="btn-primary" type="button" onClick={() => onNavigate('events')}>
              <Plus size={17} />
              New Event
            </button>
            <button className="btn-secondary" type="button" onClick={() => onNavigate('quotes')}>
              <ClipboardCheck size={17} />
              New Quote
            </button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Monthly Revenue"
          value={currency(monthly.revenue)}
          detail={`${monthly.bookedCount} booked or completed events`}
          icon={<CircleDollarSign size={20} />}
          accent="mint"
        >
          <ProgressBar value={monthly.revenue} max={12000} tone="mint" />
        </DashboardCard>
        <DashboardCard
          title="Estimated Profit"
          value={currency(monthly.estimatedProfit)}
          detail="Projected from quotes and bookings"
          icon={<Sparkles size={20} />}
          accent="gold"
        >
          <ProgressBar value={monthlyMargin * 100} max={70} tone="gold" />
        </DashboardCard>
        <DashboardCard
          title="Active Leads"
          value={`${activeLeads.length}`}
          detail={`${followUps.length} follow-ups queued`}
          icon={<Users size={20} />}
          accent="blue"
        >
          <ProgressBar value={pipelineValue} max={25000} tone="blue" />
        </DashboardCard>
        <DashboardCard
          title="Low Inventory"
          value={`${lowStock.length}`}
          detail="Items at or below threshold"
          icon={<AlertTriangle size={20} />}
          accent={lowStock.length ? 'rose' : 'mint'}
        >
          <ProgressBar value={lowStock.length} max={8} tone={lowStock.length ? 'rose' : 'mint'} />
        </DashboardCard>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <QuickAction
          title="New Event"
          detail="Create the operational record"
          icon={<Plus size={18} />}
          onClick={() => onNavigate('events')}
        />
        <QuickAction
          title="New Quote"
          detail="Price packages live"
          icon={<ClipboardCheck size={18} />}
          onClick={() => onNavigate('quotes')}
        />
        <QuickAction
          title="New Drink"
          detail="Add a recipe and costing"
          icon={<Martini size={18} />}
          onClick={() => onNavigate('drinks')}
        />
        <QuickAction
          title="Add Inventory"
          detail="Update par levels"
          icon={<PackagePlus size={18} />}
          onClick={() => onNavigate('inventory')}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label">Upcoming Events</p>
              <h2 className="section-title mt-1">Service calendar</h2>
            </div>
            <CalendarDays size={20} className="text-neeko-mint" />
          </div>
          <div className="accent-rule -mx-4 mt-4" />
          <div className="mt-4 space-y-3">
            {upcomingEvents.map((event) => (
              <div className="premium-row" key={event.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-white/10 bg-ink-950/55 text-center">
                      <span>
                        <span className="block text-xs uppercase text-stone-500">
                          {new Date(`${event.date}T12:00:00`).toLocaleString('en-US', { month: 'short' })}
                        </span>
                        <span className="block text-lg font-semibold text-stone-50">
                          {new Date(`${event.date}T12:00:00`).getDate()}
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-50">{event.eventName}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {event.venue} - {event.guestCount} guests - {event.startTime}
                      </p>
                    </div>
                  </div>
                  <StatusBadge label={event.status} />
                </div>
                <div className="mt-3">
                  <ProgressBar value={event.totalQuotedPrice || event.estimatedProfit || 1} max={maxEventRevenue} tone={event.status === 'inquiry' ? 'blue' : 'mint'} />
                </div>
                <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-4">
                  <span>{event.staffCount} staff</span>
                  <span>{defaultDrinksPerGuest(eventDurationHours(event))} drinks / guest</span>
                  <span>{formatNumber(eventDurationHours(event))} service hrs</span>
                  <span className="text-stone-300">{currency(event.totalQuotedPrice || event.estimatedProfit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <section className="panel p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label">Monthly Pulse</p>
                <h2 className="section-title mt-1">Revenue quality</h2>
                <p className="mt-2 text-sm text-stone-400">Profit, demand, and risk in one quick read.</p>
              </div>
              <DonutMetric value={Math.round(monthlyMargin * 100)} label="margin" tone="mint" />
            </div>
            <div className="mt-4 grid gap-3">
              <MiniMetric label="Revenue booked" value={currency(monthly.revenue)} tone="mint" />
              <MiniMetric label="Profit projected" value={currency(monthly.estimatedProfit)} tone="gold" />
              <MiniMetric label="Lead pipeline" value={currency(pipelineValue)} tone="blue" />
            </div>
          </section>

          <DashboardList title="Prep tasks due soon" icon={<ListChecks size={17} />}>
            {prepEvents.length ? (
              prepEvents.map((event) => (
                <li className="premium-row" key={event.id}>
                  <span className="font-medium text-stone-100">{event.eventName}</span>
                  <span className="block text-stone-500">Batch mixers, confirm staff, print menus</span>
                </li>
              ))
            ) : (
              <li className="text-stone-500">No booked prep tasks due.</li>
            )}
          </DashboardList>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <DashboardList title="Follow-up reminders" icon={<Users size={17} />}>
          {followUps.map((lead) => (
            <li className="premium-row" key={lead.id}>
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-medium text-stone-100">{lead.contactName}</span>
                  <span className="block text-stone-500">
                    {lead.nextFollowUpDate} - {lead.businessOrVenue}
                  </span>
                </span>
                <span className="text-sm font-semibold text-neeko-gold">{currency(lead.potentialEventValue)}</span>
              </div>
            </li>
          ))}
        </DashboardList>

        <DashboardList title="Low inventory warnings" icon={<AlertTriangle size={17} />}>
          {lowStock.map((item) => (
            <li className="premium-row" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-medium text-stone-100">{item.itemName}</span>
                  <span className="block text-neeko-rose">
                    {item.currentAmount} {item.unit} on hand, low at {item.lowStockThreshold}
                  </span>
                </span>
                <ArrowUpRight size={16} className="text-stone-500" />
              </div>
            </li>
          ))}
        </DashboardList>
      </section>
    </div>
  );
}

function QuickAction({
  title,
  detail,
  icon,
  onClick,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="panel group overflow-hidden p-4 text-left transition hover:-translate-y-0.5" type="button" onClick={onClick}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-mint/70 via-neeko-gold/50 to-transparent opacity-70" />
      <div className="relative flex items-center justify-between gap-3">
        <span>
          <span className="block font-semibold text-stone-50">{title}</span>
          <span className="mt-1 block text-sm text-stone-500">{detail}</span>
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-neeko-mint transition group-hover:bg-neeko-mint/[0.14]">
          {icon}
        </span>
      </div>
    </button>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'mint' | 'gold' | 'blue' }) {
  const toneClasses = {
    mint: 'text-neeko-mint',
    gold: 'text-neeko-gold',
    blue: 'text-neeko-blue',
  };

  return (
    <div className="metric-tile flex items-center justify-between gap-3">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={`font-semibold ${toneClasses[tone]}`}>{value}</span>
    </div>
  );
}

function DashboardList({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-neeko-mint">
          {icon}
        </span>
        <p className="label">{title}</p>
      </div>
      <ul className="mt-3 space-y-3 text-sm text-stone-400">{children}</ul>
    </section>
  );
}
