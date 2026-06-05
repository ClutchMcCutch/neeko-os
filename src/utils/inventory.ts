import type { InventoryCategory, InventoryItem } from '../types';

export function sortInventoryItems(items: InventoryItem[]) {
  return [...items].sort((a, b) => {
    const byName = a.itemName.trim().localeCompare(b.itemName.trim(), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return byName || a.id.localeCompare(b.id);
  });
}

export function inferInventoryCategory(itemName: string): InventoryCategory {
  const normalized = itemName.toLowerCase();

  if (normalized.includes('syrup') || normalized.includes('cordial')) return 'syrup';
  if (
    normalized.includes('juice') ||
    normalized.includes('lime') ||
    normalized.includes('lemon') ||
    normalized.includes('pineapple') ||
    normalized.includes('grapefruit') ||
    normalized.includes('cranberry')
  ) {
    return 'juice';
  }
  if (
    normalized.includes('tea') ||
    normalized.includes('coffee') ||
    normalized.includes('cold brew') ||
    normalized.includes('espresso') ||
    normalized.includes('kava')
  ) {
    return 'tea';
  }
  if (normalized.includes('spirit') || normalized.includes('botanical')) return 'NA spirit';
  if (
    normalized.includes('vodka') ||
    normalized.includes('mezcal') ||
    normalized.includes('tequila') ||
    normalized.includes('rum') ||
    normalized.includes('gin') ||
    normalized.includes('bourbon') ||
    normalized.includes('liqueur')
  ) {
    return 'alcohol';
  }
  if (normalized.includes('garnish') || normalized.includes('mint') || normalized.includes('wheel')) {
    return 'garnish';
  }
  if (
    normalized.includes('cup') ||
    normalized.includes('napkin') ||
    normalized.includes('straw') ||
    normalized.includes('ice')
  ) {
    return 'supply';
  }

  return 'other';
}
