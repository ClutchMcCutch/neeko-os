import { CalendarDays, Edit3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EventForm from '../components/EventForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import type { Drink, Event as NeekoEvent } from '../types';
import { currency, eventDurationHours, percent } from '../utils/calculations';

interface EventsPageProps {
  events: NeekoEvent[];
  drinks: Drink[];
  onEventsChange: (events: NeekoEvent[]) => void;
}

export default function EventsPage({ events, drinks, onEventsChange }: EventsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NeekoEvent | undefined>();

  const saveEvent = (event: NeekoEvent) => {
    const exists = events.some((item) => item.id === event.id);
    onEventsChange(exists ? events.map((item) => (item.id === event.id ? event : item)) : [event, ...events]);
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const deleteEvent = (id: string) => {
    onEventsChange(events.filter((event) => event.id !== id));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Events"
        title="Event pipeline and service details"
        description="Keep every quote, booking, staffing need, drink menu, and profit estimate in one operational record."
        icon={CalendarDays}
        stats={[
          { label: 'Events', value: `${events.length}`, tone: 'blue' },
          { label: 'Booked', value: `${events.filter((event) => event.status === 'booked').length}`, tone: 'mint' },
          { label: 'Complete', value: `${events.filter((event) => event.status === 'completed').length}`, tone: 'gold' },
        ]}
        actions={
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingEvent(undefined);
              setShowForm(true);
            }}
          >
            <Plus size={17} />
            New Event
          </button>
        }
      />

      {showForm ? (
        <EventForm
          event={editingEvent}
          drinks={drinks}
          onSave={saveEvent}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(undefined);
          }}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {events
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((event) => {
            const selectedDrinks = drinks.filter((drink) => event.selectedDrinkIds.includes(drink.id));
            const margin = event.totalQuotedPrice > 0 ? event.estimatedProfit / event.totalQuotedPrice : 0;
            return (
              <article className="panel overflow-hidden p-4" key={event.id}>
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-mint/70 via-neeko-gold/40 to-transparent" />
                <div className="flex items-start justify-between gap-3">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold text-stone-50">{event.eventName}</h2>
                      <StatusBadge label={event.status} />
                      <StatusBadge label={event.paymentStatus} />
                    </div>
                    <p className="mt-1 text-sm text-stone-400">
                      {event.clientName} - {event.venue}
                    </p>
                  </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-ghost min-h-9 px-2"
                      type="button"
                      aria-label="Edit event"
                      onClick={() => {
                        setEditingEvent(event);
                        setShowForm(true);
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-ghost min-h-9 px-2 text-neeko-rose hover:text-neeko-rose" type="button" aria-label="Delete event" onClick={() => deleteEvent(event.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Metric label="Date" value={event.date} />
                  <Metric label="Time" value={`${event.startTime}-${event.endTime}`} />
                  <Metric label="Guests" value={`${event.guestCount}`} />
                  <Metric label="Duration" value={`${eventDurationHours(event)} hr`} />
                  <Metric label="Quoted" value={currency(event.totalQuotedPrice)} />
                  <Metric label="Est. cost" value={currency(event.estimatedCost)} />
                  <Metric label="Est. profit" value={currency(event.estimatedProfit)} />
                  <Metric label="Margin" value={percent(margin)} />
                </div>

                <div className="mt-4">
                  <p className="label">Selected drinks</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDrinks.length ? (
                      selectedDrinks.map((drink) => (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-300" key={drink.id}>
                          {drink.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-stone-500">No drinks selected yet.</span>
                    )}
                  </div>
                </div>

                {event.notes ? <p className="note-box mt-4">{event.notes}</p> : null}
              </article>
            );
          })}
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
