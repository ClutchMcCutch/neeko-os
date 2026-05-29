import { Printer, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Drink, Event as NeekoEvent, InventoryItem } from '../types';
import {
  calculatePrepList,
  defaultDrinksPerGuest,
  eventDurationHours,
  formatNumber,
} from '../utils/calculations';

interface PrepListProps {
  event: NeekoEvent;
  drinks: Drink[];
  inventory: InventoryItem[];
}

export default function PrepList({ event, drinks, inventory }: PrepListProps) {
  const eventHours = eventDurationHours(event);
  const [drinksPerGuest, setDrinksPerGuest] = useState(defaultDrinksPerGuest(eventHours));
  const prepList = useMemo(
    () => calculatePrepList(event, drinks, inventory, drinksPerGuest),
    [drinks, drinksPerGuest, event, inventory],
  );
  const selectedDrinks = drinks.filter((drink) => event.selectedDrinkIds.includes(drink.id));

  return (
    <section className="print-panel panel overflow-hidden p-0">
      <div className="no-print flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label">Prep List Generator</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-50">{event.eventName}</h2>
          <p className="mt-1 text-sm text-stone-400">
            {event.guestCount} guests, {formatNumber(eventHours)} hours, {selectedDrinks.length} drinks selected
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1.5">
            <span className="label">Drinks per guest</span>
            <input
              className="field w-36"
              type="number"
              step="0.25"
              min={0.5}
              value={drinksPerGuest}
              onChange={(e) => setDrinksPerGuest(Number(e.target.value))}
            />
          </label>
          <button className="btn-primary" type="button" onClick={() => window.print()}>
            <Printer size={17} />
            Print
          </button>
        </div>
      </div>

      <div className="m-4 grid gap-3 sm:grid-cols-3">
        <PrepMetric label="Expected drinks" value={`${prepList.totalExpectedDrinks}`} />
        <PrepMetric label="Ice estimate" value={`${prepList.icePounds} lb`} />
        <PrepMetric label="Selected menu" value={`${selectedDrinks.length} drinks`} />
      </div>

      <section className="section-shell mx-4 mb-4">
        <div className="section-heading">
          <div>
            <p className="label">Ingredient totals</p>
            <h3 className="text-base font-semibold text-stone-50">Prep quantities with conversion and stock coverage</h3>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Oz</th>
                <th>Cups</th>
                <th>Quarts</th>
                <th>Liters</th>
                <th>Gallons</th>
                <th>Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {prepList.ingredientTotals.map((item) => (
                <tr key={item.name}>
                  <td className="font-medium text-stone-100">{item.name}</td>
                  <td>{formatNumber(item.amountOz)}</td>
                  <td>{formatNumber(item.cups)}</td>
                  <td>{formatNumber(item.quarts)}</td>
                  <td>{formatNumber(item.liters)}</td>
                  <td>{formatNumber(item.gallons)}</td>
                  <td>
                    {item.warning ? (
                      <span className="inline-flex items-center gap-1 text-neeko-rose">
                        <TriangleAlert size={14} />
                        {item.warning}
                      </span>
                    ) : (
                      <span className="text-neeko-mint">Covered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mx-4 mb-4 grid gap-4 lg:grid-cols-2">
        <Checklist title="Syrup / juice batching needs" items={prepList.ingredientTotals.map((item) => `${item.name}: ${formatNumber(item.amountOz)} oz`)} />
        <Checklist title="Garnish counts" items={prepList.garnishCounts.map((item) => `${item.name}: ${item.count}`)} />
        <Checklist title="Cups, napkins, straws" items={prepList.supplies.map((item) => `${item.item}: ${item.count}${item.warning ? ` (${item.warning})` : ''}`)} />
        <Checklist title="Pack list" items={prepList.packList} />
        <Checklist title="Night-before prep" items={prepList.nightBeforeTasks} />
        <Checklist title="Day-of prep" items={prepList.dayOfTasks} />
        <Checklist title="Arrival / setup checklist" items={prepList.setupChecklist} />
      </div>
    </section>
  );
}

function PrepMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-50">{value}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="section-shell">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-stone-400">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-stone-300">
        {items.length ? (
          items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neeko-mint" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-stone-500">No items calculated.</li>
        )}
      </ul>
    </div>
  );
}
