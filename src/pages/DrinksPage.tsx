import { Copy, Edit3, Martini, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DrinkForm from '../components/DrinkForm';
import PageHeader from '../components/PageHeader';
import type { Drink } from '../types';
import { currency } from '../utils/calculations';
import { makeId } from '../utils/storage';

interface DrinksPageProps {
  drinks: Drink[];
  onDrinksChange: (drinks: Drink[]) => void;
}

export default function DrinksPage({ drinks, onDrinksChange }: DrinksPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | undefined>();

  const saveDrink = (drink: Drink) => {
    const exists = drinks.some((item) => item.id === drink.id);
    onDrinksChange(exists ? drinks.map((item) => (item.id === drink.id ? drink : item)) : [drink, ...drinks]);
    setShowForm(false);
    setEditingDrink(undefined);
  };

  const duplicateDrink = (drink: Drink) => {
    onDrinksChange([
      {
        ...drink,
        id: makeId('drink'),
        name: `${drink.name} Copy`,
        ingredients: drink.ingredients.map((ingredient) => ({ ...ingredient, id: makeId('ingredient') })),
      },
      ...drinks,
    ]);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Drink Recipe Library"
        title="Menus, batching, and serving costs"
        description="A polished recipe library for signature drinks, zero-proof service, kava offerings, garnish planning, and per-serving margin control."
        icon={Martini}
        stats={[
          { label: 'Recipes', value: `${drinks.length}`, tone: 'mint' },
          { label: 'NA', value: `${drinks.filter((drink) => !drink.alcoholic).length}`, tone: 'blue' },
          { label: 'Cocktails', value: `${drinks.filter((drink) => drink.alcoholic).length}`, tone: 'gold' },
        ]}
        actions={
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingDrink(undefined);
              setShowForm(true);
            }}
          >
            <Plus size={17} />
            New Drink
          </button>
        }
      />

      {showForm ? (
        <DrinkForm
          drink={editingDrink}
          onSave={saveDrink}
          onCancel={() => {
            setShowForm(false);
            setEditingDrink(undefined);
          }}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {drinks.map((drink) => (
          <article className="panel overflow-hidden p-4" key={drink.id}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-blue/70 via-neeko-mint/50 to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-stone-50">{drink.name}</h2>
                  <span className="rounded-full border border-neeko-gold/25 bg-neeko-gold/10 px-2 py-1 text-xs font-semibold text-neeko-gold">
                    {drink.category}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-stone-300">
                    {drink.alcoholic ? 'Alcoholic' : 'NA'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-400">{drink.menuDescription}</p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost min-h-9 px-2" type="button" aria-label="Duplicate drink" onClick={() => duplicateDrink(drink)}>
                  <Copy size={16} />
                </button>
                <button
                  className="btn-ghost min-h-9 px-2"
                  type="button"
                  aria-label="Edit drink"
                  onClick={() => {
                    setEditingDrink(drink);
                    setShowForm(true);
                  }}
                >
                  <Edit3 size={16} />
                </button>
                <button className="btn-ghost min-h-9 px-2 text-neeko-rose hover:text-neeko-rose" type="button" aria-label="Delete drink" onClick={() => onDrinksChange(drinks.filter((item) => item.id !== drink.id))}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Cost / serving" value={currency(drink.costPerServing)} />
              <Metric label="Batch multiplier" value={`${drink.batchMultiplier}x`} />
            </div>

            <div className="section-shell mt-4">
              <p className="label">Ingredients</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-300">
                {drink.ingredients.map((ingredient) => (
                  <li className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-ink-950/35 px-3 py-2" key={ingredient.id}>
                    <span>{ingredient.name}</span>
                    <span className="font-semibold text-neeko-mint">{ingredient.ozPerServing} oz</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="note-box mt-4">
              <p>
                <span className="text-stone-300">Garnish:</span> {drink.garnish || 'None'}
              </p>
              <p className="mt-2">{drink.prepNotes}</p>
            </div>
          </article>
        ))}
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
