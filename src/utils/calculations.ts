import type {
  Drink,
  Event,
  InventoryItem,
  InventoryUnit,
  PrepIngredientTotal,
  PrepList,
  Quote,
  QuoteAddOn,
  QuoteCalculation,
} from '../types';

export interface QuoteInput {
  guestCount: number;
  eventLengthHours: number;
  packageType: string;
  numberOfDrinks: number;
  drinksPerGuest: number;
  staffCount: number;
  travelSetupFee: number;
  addOns: QuoteAddOn[];
  targetProfitMargin: number;
  selectedDrinkIds: string[];
}

export function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function percent(value: number) {
  return `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseTimeToMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function eventDurationHours(event: Pick<Event, 'startTime' | 'endTime'>) {
  const start = parseTimeToMinutes(event.startTime);
  let end = parseTimeToMinutes(event.endTime);
  if (end <= start) {
    end += 24 * 60;
  }

  return Math.max((end - start) / 60, 1);
}

export function defaultDrinksPerGuest(eventLengthHours: number) {
  return eventLengthHours > 3 ? 3 : 2;
}

export function ozToCups(oz: number) {
  return oz / 8;
}

export function ozToQuarts(oz: number) {
  return oz / 32;
}

export function ozToLiters(oz: number) {
  return oz * 0.0295735;
}

export function ozToGallons(oz: number) {
  return oz / 128;
}

export function toOunces(amount: number, unit: InventoryUnit) {
  switch (unit) {
    case 'oz':
      return amount;
    case 'cups':
      return amount * 8;
    case 'quarts':
      return amount * 32;
    case 'liters':
      return amount / 0.0295735;
    case 'gallons':
      return amount * 128;
    case 'bottles':
      return amount * 25.36;
    case 'count':
      return amount;
    default:
      return amount;
  }
}

export function convertIngredientTotal(name: string, amountOz: number): PrepIngredientTotal {
  return {
    name,
    amountOz,
    cups: ozToCups(amountOz),
    quarts: ozToQuarts(amountOz),
    liters: ozToLiters(amountOz),
    gallons: ozToGallons(amountOz),
  };
}

function averageDrinkCost(drinks: Drink[]) {
  if (!drinks.length) {
    return 3.25;
  }

  return drinks.reduce((sum, drink) => sum + drink.costPerServing, 0) / drinks.length;
}

function priceForMargin(cost: number, margin: number, fixedRevenue: number) {
  const safeMargin = Math.min(Math.max(margin, 0.05), 0.82);
  return cost / (1 - safeMargin) + fixedRevenue;
}

export function calculateQuote(input: QuoteInput, drinks: Drink[]): QuoteCalculation {
  const selectedDrinks = drinks.filter((drink) => input.selectedDrinkIds.includes(drink.id));
  const estimatedDrinkVolume = Math.round(input.guestCount * input.drinksPerGuest);
  const avgCost = averageDrinkCost(selectedDrinks);
  const ingredientCostEstimate = estimatedDrinkVolume * avgCost;
  const laborCostEstimate = input.staffCount * (input.eventLengthHours + 2) * 35;
  const supplyCostEstimate = estimatedDrinkVolume * 0.85;
  const addOnRevenue = input.addOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const addOnCost = input.addOns.reduce((sum, addOn) => sum + addOn.cost, 0);
  const totalEstimatedCost =
    ingredientCostEstimate + laborCostEstimate + supplyCostEstimate + addOnCost;
  const fixedRevenue = input.travelSetupFee + addOnRevenue;
  const standardPrice = priceForMargin(totalEstimatedCost, input.targetProfitMargin, fixedRevenue);
  const leanPrice = priceForMargin(totalEstimatedCost, input.targetProfitMargin - 0.08, fixedRevenue);
  const premiumPrice = priceForMargin(totalEstimatedCost, input.targetProfitMargin + 0.08, fixedRevenue);
  const estimatedProfit = standardPrice - totalEstimatedCost;
  const profitMargin = standardPrice > 0 ? estimatedProfit / standardPrice : 0;

  return {
    estimatedDrinkVolume,
    ingredientCostEstimate,
    laborCostEstimate,
    supplyCostEstimate,
    addOnRevenue,
    addOnCost,
    totalEstimatedCost,
    suggestedPrice: standardPrice,
    estimatedProfit,
    profitMargin,
    leanPrice,
    standardPrice,
    premiumPrice,
  };
}

export function quoteToEventPatch(quote: Quote) {
  return {
    guestCount: quote.guestCount,
    beverageType: quote.beverageType,
    selectedDrinkIds: quote.selectedDrinkIds,
    staffCount: quote.staffCount,
    status: 'quoted' as const,
    totalQuotedPrice: Math.round(quote.calculated.standardPrice),
    estimatedCost: Math.round(quote.calculated.totalEstimatedCost),
    estimatedProfit: Math.round(quote.calculated.estimatedProfit),
    quoteId: quote.id,
  };
}

export function calculatePrepList(
  event: Event,
  drinks: Drink[],
  inventory: InventoryItem[],
  drinksPerGuest = defaultDrinksPerGuest(eventDurationHours(event)),
): PrepList {
  const selectedDrinks = drinks.filter((drink) => event.selectedDrinkIds.includes(drink.id));
  const totalExpectedDrinks = Math.round(event.guestCount * drinksPerGuest);
  const servingsPerDrink = selectedDrinks.length
    ? Math.ceil(totalExpectedDrinks / selectedDrinks.length)
    : totalExpectedDrinks;

  const ingredientMap = new Map<string, number>();
  const garnishMap = new Map<string, number>();

  selectedDrinks.forEach((drink) => {
    drink.ingredients.forEach((ingredient) => {
      const existing = ingredientMap.get(ingredient.name) ?? 0;
      ingredientMap.set(ingredient.name, existing + ingredient.ozPerServing * servingsPerDrink);
    });

    if (drink.garnish.trim()) {
      garnishMap.set(drink.garnish, (garnishMap.get(drink.garnish) ?? 0) + servingsPerDrink);
    }
  });

  const ingredientTotals = Array.from(ingredientMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, amountOz]) => withInventoryWarning(convertIngredientTotal(name, amountOz), inventory));

  const garnishCounts = Array.from(garnishMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cups = Math.ceil(totalExpectedDrinks * 1.15);
  const napkins = Math.ceil(totalExpectedDrinks * 1.3);
  const straws = Math.ceil(totalExpectedDrinks * 0.65);
  const icePounds = Math.ceil(totalExpectedDrinks * 0.9 + event.guestCount * 0.35);
  const supplies = [
    supplyWarning('9oz compostable cups', cups, inventory),
    supplyWarning('Cocktail napkins', napkins, inventory),
    supplyWarning('Compostable straws', straws, inventory),
    supplyWarning('Ice bags', Math.ceil(icePounds / 10), inventory),
  ];

  return {
    eventId: event.id,
    totalExpectedDrinks,
    drinksPerGuest,
    ingredientTotals,
    garnishCounts,
    supplies,
    icePounds,
    packList: [
      'Mobile bar facade and service mats',
      'Speed rails, pour spouts, jiggers, shakers, strainers',
      'Ice wells, scoops, dump buckets, towel roll',
      'Printed menu, table tent, QR payment sign',
      'Backup extension cord, tape, lighter, pens, labels',
      'Sanitizer bucket, gloves, trash liners, compost bin',
    ],
    nightBeforeTasks: [
      'Batch syrups, teas, juices, and labeled mixer bottles',
      'Print menus, prep signage, and event packet',
      'Confirm staff call time, parking, load-in route, and contact number',
      'Freeze garnish picks or prep dry garnish where possible',
    ],
    dayOfTasks: [
      'Juice citrus and cucumber as needed',
      'Pack cold items into labeled coolers with temp logs',
      'Pick up ice within four hours of arrival',
      'Load inventory by station: build, serve, garnish, backup',
    ],
    setupChecklist: [
      'Arrive 90 minutes before service',
      'Walk venue with client or planner',
      'Set bar flow: queue, order, pickup, water station',
      'Stock first-wave bottles and keep backup under bar',
      'Take prep photos before service and closing photos after breakdown',
    ],
  };
}

function withInventoryWarning(total: PrepIngredientTotal, inventory: InventoryItem[]) {
  const match = inventory.find(
    (item) => item.itemName.toLowerCase() === total.name.toLowerCase(),
  );

  if (!match) {
    return { ...total, warning: 'Not tracked in inventory' };
  }

  const available = toOunces(match.currentAmount, match.unit);
  const warning =
    available < total.amountOz
      ? `Short by ${formatNumber(total.amountOz - available)} oz`
      : undefined;

  return {
    ...total,
    inventoryAmountOz: available,
    inventoryUnit: match.unit,
    warning,
  };
}

function supplyWarning(itemName: string, count: number, inventory: InventoryItem[]) {
  const match = inventory.find((item) => item.itemName.toLowerCase().includes(itemName.toLowerCase()));
  const warning = match && match.currentAmount < count ? `Need ${count - match.currentAmount} more` : undefined;
  return { item: itemName, count, warning };
}

export function lowInventoryItems(inventory: InventoryItem[]) {
  return inventory.filter((item) => item.currentAmount <= item.lowStockThreshold);
}

export function monthlyEventTotals(events: Event[], monthDate = new Date()) {
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();
  const monthEvents = events.filter((event) => {
    const date = new Date(`${event.date}T12:00:00`);
    return date.getMonth() === month && date.getFullYear() === year && event.status !== 'canceled';
  });

  return {
    revenue: monthEvents.reduce((sum, event) => sum + event.totalQuotedPrice, 0),
    estimatedProfit: monthEvents.reduce((sum, event) => sum + event.estimatedProfit, 0),
    bookedCount: monthEvents.filter((event) => event.status === 'booked' || event.status === 'completed').length,
  };
}

export function completedEventMetrics(events: Event[]) {
  const completed = events
    .filter((event) => event.status === 'completed')
    .sort(
      (a, b) =>
        new Date(`${b.date}T12:00:00`).getTime() - new Date(`${a.date}T12:00:00`).getTime(),
    );
  const revenue = completed.reduce((sum, event) => sum + event.totalQuotedPrice, 0);
  const estimatedCost = completed.reduce((sum, event) => sum + event.estimatedCost, 0);
  const actualCost = completed.reduce((sum, event) => sum + event.actualCost, 0);
  const profit = completed.reduce((sum, event) => sum + event.actualProfit, 0);
  const guests = completed.reduce((sum, event) => sum + event.guestCount, 0);

  return {
    completed,
    revenue,
    estimatedCost,
    actualCost,
    profit,
    profitMargin: revenue > 0 ? profit / revenue : 0,
    costPerGuest: guests > 0 ? actualCost / guests : 0,
    revenuePerGuest: guests > 0 ? revenue / guests : 0,
  };
}
