import { useEffect, useState, type FormEvent } from 'react';
import type { BeverageType, Drink, Event as NeekoEvent, EventStatus, PaymentStatus } from '../types';
import { makeId } from '../utils/storage';

interface EventFormProps {
  event?: NeekoEvent;
  drinks: Drink[];
  onSave: (event: NeekoEvent) => void;
  onCancel: () => void;
}

const eventStatuses: EventStatus[] = ['inquiry', 'quoted', 'booked', 'completed', 'canceled'];
const paymentStatuses: PaymentStatus[] = ['unpaid', 'deposit paid', 'paid', 'refunded'];
const beverageTypes: BeverageType[] = ['alcoholic', 'na', 'both'];

function emptyEvent(): NeekoEvent {
  return {
    id: makeId('event'),
    eventName: '',
    clientName: '',
    venue: '',
    address: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '17:00',
    endTime: '21:00',
    guestCount: 75,
    eventType: 'Private event',
    beverageType: 'both',
    selectedDrinkIds: [],
    staffCount: 2,
    status: 'inquiry',
    notes: '',
    paymentStatus: 'unpaid',
    totalQuotedPrice: 0,
    estimatedCost: 0,
    estimatedProfit: 0,
    actualCost: 0,
    actualProfit: 0,
  };
}

export default function EventForm({ event, drinks, onSave, onCancel }: EventFormProps) {
  const [draft, setDraft] = useState<NeekoEvent>(() => event ?? emptyEvent());

  useEffect(() => {
    setDraft(event ?? emptyEvent());
  }, [event]);

  const update = <K extends keyof NeekoEvent>(field: K, value: NeekoEvent[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const toggleDrink = (id: string) => {
    setDraft((current) => ({
      ...current,
      selectedDrinkIds: current.selectedDrinkIds.includes(id)
        ? current.selectedDrinkIds.filter((drinkId) => drinkId !== id)
        : [...current.selectedDrinkIds, id],
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      estimatedProfit: draft.totalQuotedPrice - draft.estimatedCost,
      actualProfit: draft.status === 'completed' ? draft.totalQuotedPrice - draft.actualCost : draft.actualProfit,
    });
  };

  return (
    <form className="panel overflow-hidden p-0" onSubmit={submit}>
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label">{event ? 'Edit Event' : 'New Event'}</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-50">
            {draft.eventName || 'Event details'}
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" type="submit">
            Save Event
          </button>
        </div>
      </div>

      <section className="section-shell m-4">
        <div className="section-heading">
          <div>
            <p className="label">Event Profile</p>
            <h3 className="text-base font-semibold text-stone-50">Client, venue, timing, and service scope</h3>
          </div>
        </div>
      <div className="form-grid lg:grid-cols-4">
        <label className="space-y-1.5 lg:col-span-2">
          <span className="label">Event name</span>
          <input className="field" value={draft.eventName} onChange={(e) => update('eventName', e.target.value)} required />
        </label>
        <label className="space-y-1.5">
          <span className="label">Client</span>
          <input className="field" value={draft.clientName} onChange={(e) => update('clientName', e.target.value)} required />
        </label>
        <label className="space-y-1.5">
          <span className="label">Event type</span>
          <input className="field" value={draft.eventType} onChange={(e) => update('eventType', e.target.value)} />
        </label>
        <label className="space-y-1.5 lg:col-span-2">
          <span className="label">Venue</span>
          <input className="field" value={draft.venue} onChange={(e) => update('venue', e.target.value)} />
        </label>
        <label className="space-y-1.5 lg:col-span-2">
          <span className="label">Address</span>
          <input className="field" value={draft.address} onChange={(e) => update('address', e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Date</span>
          <input className="field" type="date" value={draft.date} onChange={(e) => update('date', e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Start</span>
          <input className="field" type="time" value={draft.startTime} onChange={(e) => update('startTime', e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">End</span>
          <input className="field" type="time" value={draft.endTime} onChange={(e) => update('endTime', e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Guests</span>
          <input className="field" type="number" min={1} value={draft.guestCount} onChange={(e) => update('guestCount', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Beverage</span>
          <select className="field" value={draft.beverageType} onChange={(e) => update('beverageType', e.target.value as BeverageType)}>
            {beverageTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="label">Staff</span>
          <input className="field" type="number" min={0} value={draft.staffCount} onChange={(e) => update('staffCount', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Status</span>
          <select className="field" value={draft.status} onChange={(e) => update('status', e.target.value as EventStatus)}>
            {eventStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="label">Payment</span>
          <select className="field" value={draft.paymentStatus} onChange={(e) => update('paymentStatus', e.target.value as PaymentStatus)}>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="label">Quoted price</span>
          <input className="field" type="number" min={0} value={draft.totalQuotedPrice} onChange={(e) => update('totalQuotedPrice', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Estimated cost</span>
          <input className="field" type="number" min={0} value={draft.estimatedCost} onChange={(e) => update('estimatedCost', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Actual cost</span>
          <input className="field" type="number" min={0} value={draft.actualCost} onChange={(e) => update('actualCost', Number(e.target.value))} />
        </label>
      </div>
      </section>

      <section className="section-shell mx-4 mb-4">
        <div className="section-heading">
          <div>
            <p className="label">Selected drinks</p>
            <h3 className="text-base font-semibold text-stone-50">Menu lineup for prep and quoting</h3>
          </div>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {drinks.map((drink) => {
            const selected = draft.selectedDrinkIds.includes(drink.id);
            return (
              <button
                className={`choice-card ${
                  selected
                    ? 'choice-card-selected text-stone-50'
                    : 'border-white/10 text-stone-300'
                }`}
                key={drink.id}
                type="button"
                onClick={() => toggleDrink(drink.id)}
              >
                <span className="font-semibold">{drink.name}</span>
                <span className="mt-1 block text-xs text-stone-500">{drink.category}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-shell mx-4 mb-4">
        <label className="block space-y-1.5">
          <span className="label">Notes</span>
          <textarea className="field min-h-24" value={draft.notes} onChange={(e) => update('notes', e.target.value)} />
        </label>
      </section>
    </form>
  );
}
