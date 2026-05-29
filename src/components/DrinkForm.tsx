import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Drink, DrinkCategory, Ingredient } from '../types';
import { makeId } from '../utils/storage';

interface DrinkFormProps {
  drink?: Drink;
  onSave: (drink: Drink) => void;
  onCancel: () => void;
}

const categories: DrinkCategory[] = [
  'Neeko Original',
  'Classic',
  'Seasonal',
  'Kava',
  'Cocktail',
  'Mocktail',
];

function emptyIngredient(): Ingredient {
  return {
    id: makeId('ingredient'),
    name: '',
    ozPerServing: 0.5,
  };
}

function emptyDrink(): Drink {
  return {
    id: makeId('drink'),
    name: '',
    category: 'Neeko Original',
    alcoholic: false,
    ingredients: [emptyIngredient()],
    garnish: '',
    prepNotes: '',
    costPerServing: 2.75,
    batchMultiplier: 1,
    menuDescription: '',
  };
}

export default function DrinkForm({ drink, onSave, onCancel }: DrinkFormProps) {
  const [draft, setDraft] = useState<Drink>(() => drink ?? emptyDrink());

  useEffect(() => {
    setDraft(drink ?? emptyDrink());
  }, [drink]);

  const update = <K extends keyof Drink>(field: K, value: Drink[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateIngredient = <K extends keyof Ingredient>(id: string, field: K, value: Ingredient[K]) => {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [field]: value } : ingredient,
      ),
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      ingredients: draft.ingredients.filter((ingredient) => ingredient.name.trim()),
    });
  };

  return (
    <form className="panel overflow-hidden p-0" onSubmit={submit}>
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label">{drink ? 'Edit Drink' : 'New Drink'}</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-50">{draft.name || 'Recipe details'}</h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" type="submit">
            Save Drink
          </button>
        </div>
      </div>

      <section className="section-shell m-4">
        <div className="section-heading">
          <div>
            <p className="label">Recipe Profile</p>
            <h3 className="text-base font-semibold text-stone-50">Menu identity, cost, garnish, and batching</h3>
          </div>
        </div>
      <div className="form-grid">
        <label className="space-y-1.5 xl:col-span-2">
          <span className="label">Drink name</span>
          <input className="field" value={draft.name} onChange={(e) => update('name', e.target.value)} required />
        </label>
        <label className="space-y-1.5">
          <span className="label">Category</span>
          <select className="field" value={draft.category} onChange={(e) => update('category', e.target.value as DrinkCategory)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="label">Alcoholic</span>
          <select className="field" value={draft.alcoholic ? 'yes' : 'no'} onChange={(e) => update('alcoholic', e.target.value === 'yes')}>
            <option value="no">NA</option>
            <option value="yes">Alcoholic</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="label">Cost per serving</span>
          <input className="field" type="number" step="0.01" min={0} value={draft.costPerServing} onChange={(e) => update('costPerServing', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Batch multiplier</span>
          <input className="field" type="number" step="0.1" min={0.1} value={draft.batchMultiplier} onChange={(e) => update('batchMultiplier', Number(e.target.value))} />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="label">Garnish</span>
          <input className="field" value={draft.garnish} onChange={(e) => update('garnish', e.target.value)} />
        </label>
      </div>
      </section>

      <section className="section-shell mx-4 mb-4">
        <div className="section-heading">
          <div>
            <p className="label">Ingredients per serving</p>
            <h3 className="text-base font-semibold text-stone-50">Ounce-level recipe controls</h3>
          </div>
          <button
            className="btn-secondary min-h-9 px-3"
            type="button"
            onClick={() => update('ingredients', [...draft.ingredients, emptyIngredient()])}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {draft.ingredients.map((ingredient) => (
            <div className="premium-row grid gap-2 sm:grid-cols-[1fr_8rem_2.75rem]" key={ingredient.id}>
              <input className="field" placeholder="Ingredient name" value={ingredient.name} onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)} />
              <input className="field" type="number" step="0.05" min={0} value={ingredient.ozPerServing} onChange={(e) => updateIngredient(ingredient.id, 'ozPerServing', Number(e.target.value))} />
              <button
                className="btn-ghost min-h-10 px-2"
                type="button"
                aria-label="Remove ingredient"
                onClick={() => update('ingredients', draft.ingredients.filter((item) => item.id !== ingredient.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell mx-4 mb-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="label">Prep notes</span>
          <textarea className="field min-h-24" value={draft.prepNotes} onChange={(e) => update('prepNotes', e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="label">Menu description</span>
          <textarea className="field min-h-24" value={draft.menuDescription} onChange={(e) => update('menuDescription', e.target.value)} />
        </label>
      </div>
      </section>
    </form>
  );
}
