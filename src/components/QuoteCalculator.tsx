import { Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BeverageType, Drink, Event as NeekoEvent, Quote, QuoteAddOn } from '../types';
import {
  calculateQuote,
  currency,
  defaultDrinksPerGuest,
  eventDurationHours,
  percent,
} from '../utils/calculations';
import { makeId } from '../utils/storage';

interface QuoteCalculatorProps {
  drinks: Drink[];
  events: NeekoEvent[];
  onSave: (quote: Quote) => void;
}

interface QuoteFormState {
  guestCount: number;
  eventLengthHours: number;
  packageType: string;
  numberOfDrinks: number;
  drinksPerGuest: number;
  beverageType: BeverageType;
  staffCount: number;
  travelSetupFee: number;
  addOns: QuoteAddOn[];
  targetProfitMargin: number;
  selectedDrinkIds: string[];
}

const packageTypes = [
  'Full-service signature bar',
  'Zero-proof premium bar',
  'Kava and mocktail lounge',
  'Cocktail reception',
  'Market pop-up service',
];

function emptyAddOn(): QuoteAddOn {
  return {
    id: makeId('addon'),
    name: '',
    price: 0,
    cost: 0,
  };
}

const initialState: QuoteFormState = {
  guestCount: 100,
  eventLengthHours: 4,
  packageType: packageTypes[0],
  numberOfDrinks: 3,
  drinksPerGuest: defaultDrinksPerGuest(4),
  beverageType: 'both',
  staffCount: 2,
  travelSetupFee: 350,
  addOns: [{ id: 'addon-default-signage', name: 'Custom menu signage', price: 125, cost: 38 }],
  targetProfitMargin: 0.5,
  selectedDrinkIds: [],
};

export default function QuoteCalculator({ drinks, events, onSave }: QuoteCalculatorProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [quoteName, setQuoteName] = useState('New Event Quote');
  const [form, setForm] = useState<QuoteFormState>(initialState);

  const calculation = useMemo(
    () =>
      calculateQuote(
        {
          guestCount: form.guestCount,
          eventLengthHours: form.eventLengthHours,
          packageType: form.packageType,
          numberOfDrinks: form.numberOfDrinks,
          drinksPerGuest: form.drinksPerGuest,
          staffCount: form.staffCount,
          travelSetupFee: form.travelSetupFee,
          addOns: form.addOns,
          targetProfitMargin: form.targetProfitMargin,
          selectedDrinkIds: form.selectedDrinkIds,
        },
        drinks,
      ),
    [drinks, form],
  );

  const update = <K extends keyof QuoteFormState>(field: K, value: QuoteFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const loadEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    const eventLengthHours = eventDurationHours(event);
    setQuoteName(`${event.eventName} Quote`);
    setForm((current) => ({
      ...current,
      guestCount: event.guestCount,
      eventLengthHours,
      drinksPerGuest: defaultDrinksPerGuest(eventLengthHours),
      beverageType: event.beverageType,
      staffCount: event.staffCount,
      selectedDrinkIds: event.selectedDrinkIds,
      numberOfDrinks: Math.max(event.selectedDrinkIds.length, 1),
    }));
  };

  const toggleDrink = (id: string) => {
    setForm((current) => {
      const selectedDrinkIds = current.selectedDrinkIds.includes(id)
        ? current.selectedDrinkIds.filter((drinkId) => drinkId !== id)
        : [...current.selectedDrinkIds, id];

      return {
        ...current,
        selectedDrinkIds,
        numberOfDrinks: Math.max(selectedDrinkIds.length, 1),
      };
    });
  };

  const updateAddOn = <K extends keyof QuoteAddOn>(id: string, field: K, value: QuoteAddOn[K]) => {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.map((addOn) => (addOn.id === id ? { ...addOn, [field]: value } : addOn)),
    }));
  };

  const saveQuote = () => {
    const quote: Quote = {
      id: makeId('quote'),
      name: quoteName.trim() || 'Untitled quote',
      eventId: selectedEventId || undefined,
      createdAt: new Date().toISOString(),
      guestCount: form.guestCount,
      eventLengthHours: form.eventLengthHours,
      packageType: form.packageType,
      numberOfDrinks: form.numberOfDrinks,
      drinksPerGuest: form.drinksPerGuest,
      beverageType: form.beverageType,
      staffCount: form.staffCount,
      travelSetupFee: form.travelSetupFee,
      addOns: form.addOns.filter((addOn) => addOn.name.trim()),
      targetProfitMargin: form.targetProfitMargin,
      selectedDrinkIds: form.selectedDrinkIds,
      calculated: calculation,
    };

    onSave(quote);
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="panel overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Quote Generator</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-50">Build pricing from event demand</h2>
          </div>
          <button className="btn-primary" type="button" onClick={saveQuote}>
            <Save size={17} />
            Save Quote
          </button>
        </div>

        <section className="section-shell m-4">
          <div className="section-heading">
            <div>
              <p className="label">Quote Inputs</p>
              <h3 className="text-base font-semibold text-stone-50">Demand, service package, staffing, and margin</h3>
            </div>
          </div>
        <div className="form-grid">
          <label className="space-y-1.5 md:col-span-2">
            <span className="label">Save to event</span>
            <select className="field" value={selectedEventId} onChange={(e) => loadEvent(e.target.value)}>
              <option value="">No event selected</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="label">Quote name</span>
            <input className="field" value={quoteName} onChange={(e) => setQuoteName(e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Guest count</span>
            <input className="field" type="number" min={1} value={form.guestCount} onChange={(e) => update('guestCount', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Event hours</span>
            <input className="field" type="number" min={1} step={0.5} value={form.eventLengthHours} onChange={(e) => update('eventLengthHours', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Drinks per guest</span>
            <input className="field" type="number" min={0.5} step={0.25} value={form.drinksPerGuest} onChange={(e) => update('drinksPerGuest', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Menu drinks</span>
            <input className="field" type="number" min={1} value={form.numberOfDrinks} onChange={(e) => update('numberOfDrinks', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="label">Package type</span>
            <select className="field" value={form.packageType} onChange={(e) => update('packageType', e.target.value)}>
              {packageTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="label">Alcoholic / NA / both</span>
            <select className="field" value={form.beverageType} onChange={(e) => update('beverageType', e.target.value as BeverageType)}>
              <option value="alcoholic">Alcoholic</option>
              <option value="na">NA</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="label">Staff count</span>
            <input className="field" type="number" min={0} value={form.staffCount} onChange={(e) => update('staffCount', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Travel / setup fee</span>
            <input className="field" type="number" min={0} value={form.travelSetupFee} onChange={(e) => update('travelSetupFee', Number(e.target.value))} />
          </label>
          <label className="space-y-1.5">
            <span className="label">Target margin</span>
            <input className="field" type="number" min={5} max={80} value={Math.round(form.targetProfitMargin * 100)} onChange={(e) => update('targetProfitMargin', Number(e.target.value) / 100)} />
          </label>
        </div>
        </section>

        <section className="section-shell mx-4 mb-4">
          <div className="section-heading">
            <div>
              <p className="label">Selected drinks</p>
              <h3 className="text-base font-semibold text-stone-50">Recipes used for cost estimates</h3>
            </div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {drinks.map((drink) => {
              const selected = form.selectedDrinkIds.includes(drink.id);
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
                  <span className="mt-1 block text-xs text-stone-500">
                    {drink.alcoholic ? 'Alcoholic' : 'NA'} - {currency(drink.costPerServing)} cost
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section-shell mx-4 mb-4">
          <div className="section-heading">
            <div>
              <p className="label">Custom add-ons</p>
              <h3 className="text-base font-semibold text-stone-50">Revenue and cost modifiers</h3>
            </div>
            <button className="btn-secondary min-h-9 px-3" type="button" onClick={() => update('addOns', [...form.addOns, emptyAddOn()])}>
              <Plus size={16} />
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {form.addOns.map((addOn) => (
              <div className="premium-row grid gap-2 sm:grid-cols-[1fr_7rem_7rem_2.75rem]" key={addOn.id}>
                <input className="field" placeholder="Add-on name" value={addOn.name} onChange={(e) => updateAddOn(addOn.id, 'name', e.target.value)} />
                <input className="field" type="number" placeholder="Price" value={addOn.price} onChange={(e) => updateAddOn(addOn.id, 'price', Number(e.target.value))} />
                <input className="field" type="number" placeholder="Cost" value={addOn.cost} onChange={(e) => updateAddOn(addOn.id, 'cost', Number(e.target.value))} />
                <button
                  className="btn-ghost min-h-10 px-2"
                  type="button"
                  aria-label="Remove add-on"
                  onClick={() => update('addOns', form.addOns.filter((item) => item.id !== addOn.id))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="panel overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-gold via-neeko-mint to-transparent" />
          <p className="label">Pricing options</p>
          <div className="mt-3 space-y-3">
            <PriceOption name="Lean" value={calculation.leanPrice} detail="Useful for strategic accounts" />
            <PriceOption name="Standard" value={calculation.standardPrice} detail="Recommended quote" active />
            <PriceOption name="Premium" value={calculation.premiumPrice} detail="Best for complex service" />
          </div>
        </div>

        <div className="panel p-4">
          <p className="label">Live estimate</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Drink volume" value={`${calculation.estimatedDrinkVolume}`} />
            <Metric label="Margin" value={percent(calculation.profitMargin)} />
            <Metric label="Ingredient cost" value={currency(calculation.ingredientCostEstimate)} />
            <Metric label="Labor cost" value={currency(calculation.laborCostEstimate)} />
            <Metric label="Supply cost" value={currency(calculation.supplyCostEstimate)} />
            <Metric label="Add-on cost" value={currency(calculation.addOnCost)} />
          </div>
          <div className="mt-4 rounded-md border border-neeko-mint/20 bg-neeko-mint/[0.07] p-3">
            <div className="flex items-center justify-between text-sm text-stone-400">
              <span>Total cost</span>
              <span>{currency(calculation.totalEstimatedCost)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-stone-400">
              <span>Estimated profit</span>
              <span className="font-semibold text-neeko-mint">{currency(calculation.estimatedProfit)}</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function PriceOption({
  name,
  value,
  detail,
  active = false,
}: {
  name: string;
  value: number;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className={`rounded-md border p-3 transition ${active ? 'border-neeko-mint/40 bg-neeko-mint/10 shadow-[0_14px_34px_rgba(98,214,173,0.10)]' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-stone-100">{name}</p>
        <p className="text-lg font-semibold text-stone-50">{currency(value)}</p>
      </div>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-stone-100">{value}</p>
    </div>
  );
}
