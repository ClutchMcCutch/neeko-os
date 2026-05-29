import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { InventoryCategory, InventoryItem, InventoryUnit } from '../types';
import { currency } from '../utils/calculations';
import { makeId } from '../utils/storage';

interface InventoryTableProps {
  items: InventoryItem[];
  onChange: (items: InventoryItem[]) => void;
}

const categories: InventoryCategory[] = [
  'syrup',
  'juice',
  'tea',
  'NA spirit',
  'alcohol',
  'garnish',
  'supply',
  'other',
];

const units: InventoryUnit[] = [
  'oz',
  'cups',
  'quarts',
  'liters',
  'gallons',
  'bottles',
  'cartons',
  'packs',
  'bags',
  'jars',
  'bunches',
  'containers',
  'cans',
  'canisters',
  'pints',
  'count',
];

function emptyItem(): InventoryItem {
  return {
    id: makeId('inventory'),
    itemName: '',
    category: 'other',
    currentAmount: 0,
    unit: 'count',
    cost: 0,
    lowStockThreshold: 0,
    notes: '',
  };
}

export default function InventoryTable({ items, onChange }: InventoryTableProps) {
  const [draft, setDraft] = useState<InventoryItem | null>(null);

  const save = () => {
    if (!draft || !draft.itemName.trim()) return;

    const exists = items.some((item) => item.id === draft.id);
    onChange(exists ? items.map((item) => (item.id === draft.id ? draft : item)) : [draft, ...items]);
    setDraft(null);
  };

  const update = <K extends keyof InventoryItem>(field: K, value: InventoryItem[K]) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const deleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Inventory Tracker</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-50">Stock, par levels, and notes</h2>
        </div>
        <button className="btn-primary" type="button" onClick={() => setDraft(emptyItem())}>
          <Plus size={17} />
          Add Inventory
        </button>
      </div>

      {draft ? (
        <div className="border-b border-white/10 bg-ink-950/40 p-4">
          <div className="section-shell">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <label className="space-y-1.5 md:col-span-2">
              <span className="label">Item</span>
              <input className="field" value={draft.itemName} onChange={(e) => update('itemName', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Category</span>
              <select className="field" value={draft.category} onChange={(e) => update('category', e.target.value as InventoryCategory)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="label">Amount</span>
              <input className="field" type="number" step="0.01" value={draft.currentAmount} onChange={(e) => update('currentAmount', Number(e.target.value))} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Unit</span>
              <select className="field" value={draft.unit} onChange={(e) => update('unit', e.target.value as InventoryUnit)}>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="label">Cost</span>
              <input className="field" type="number" step="0.01" value={draft.cost} onChange={(e) => update('cost', Number(e.target.value))} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Low threshold</span>
              <input className="field" type="number" step="0.01" value={draft.lowStockThreshold} onChange={(e) => update('lowStockThreshold', Number(e.target.value))} />
            </label>
            <label className="space-y-1.5 md:col-span-4 xl:col-span-7">
              <span className="label">Notes</span>
              <input className="field" value={draft.notes} onChange={(e) => update('notes', e.target.value)} />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setDraft(null)}>
              <X size={16} />
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={save}>
              <Save size={16} />
              Save
            </button>
          </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="data-table min-w-[880px]">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>On hand</th>
              <th>Low at</th>
              <th>Cost</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => {
              const low = item.currentAmount <= item.lowStockThreshold;
              return (
                <tr key={item.id}>
                  <td className="font-medium text-stone-100">
                    {item.itemName}
                    {low ? <span className="ml-2 rounded-full bg-neeko-rose/10 px-2 py-0.5 text-xs text-neeko-rose">Low</span> : null}
                  </td>
                  <td className="capitalize">{item.category}</td>
                  <td>
                    {item.currentAmount} {item.unit}
                  </td>
                  <td>
                    {item.lowStockThreshold} {item.unit}
                  </td>
                  <td>{currency(item.cost)}</td>
                  <td className="max-w-xs text-stone-400">{item.notes}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="btn-ghost min-h-9 px-2" type="button" aria-label="Edit item" onClick={() => setDraft(item)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-ghost min-h-9 px-2 text-neeko-rose hover:text-neeko-rose" type="button" aria-label="Delete item" onClick={() => deleteItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
