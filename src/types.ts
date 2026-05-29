export type DrinkCategory =
  | 'Neeko Original'
  | 'Classic'
  | 'Seasonal'
  | 'Kava'
  | 'Cocktail'
  | 'Mocktail';

export type BeverageType = 'alcoholic' | 'na' | 'both';

export type EventStatus = 'inquiry' | 'quoted' | 'booked' | 'completed' | 'canceled';

export type PaymentStatus = 'unpaid' | 'deposit paid' | 'paid' | 'refunded';

export type InventoryCategory =
  | 'syrup'
  | 'juice'
  | 'tea'
  | 'NA spirit'
  | 'alcohol'
  | 'garnish'
  | 'supply'
  | 'other';

export type InventoryUnit =
  | 'oz'
  | 'cups'
  | 'quarts'
  | 'liters'
  | 'gallons'
  | 'bottles'
  | 'cartons'
  | 'packs'
  | 'bags'
  | 'jars'
  | 'bunches'
  | 'containers'
  | 'cans'
  | 'canisters'
  | 'pints'
  | 'count';

export type LeadType =
  | 'wedding planner'
  | 'venue'
  | 'bar'
  | 'restaurant'
  | 'market'
  | 'private client'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'reached out'
  | 'responded'
  | 'meeting booked'
  | 'quote sent'
  | 'booked'
  | 'lost'
  | 'follow up later';

export interface Ingredient {
  id: string;
  name: string;
  ozPerServing: number;
}

export interface Drink {
  id: string;
  name: string;
  category: DrinkCategory;
  alcoholic: boolean;
  ingredients: Ingredient[];
  garnish: string;
  prepNotes: string;
  costPerServing: number;
  batchMultiplier: number;
  menuDescription: string;
}

export interface Event {
  id: string;
  eventName: string;
  clientName: string;
  venue: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  eventType: string;
  beverageType: BeverageType;
  selectedDrinkIds: string[];
  staffCount: number;
  status: EventStatus;
  notes: string;
  paymentStatus: PaymentStatus;
  totalQuotedPrice: number;
  estimatedCost: number;
  estimatedProfit: number;
  actualCost: number;
  actualProfit: number;
  quoteId?: string;
}

export interface QuoteAddOn {
  id: string;
  name: string;
  price: number;
  cost: number;
}

export interface QuoteCalculation {
  estimatedDrinkVolume: number;
  ingredientCostEstimate: number;
  laborCostEstimate: number;
  supplyCostEstimate: number;
  addOnRevenue: number;
  addOnCost: number;
  totalEstimatedCost: number;
  suggestedPrice: number;
  estimatedProfit: number;
  profitMargin: number;
  leanPrice: number;
  standardPrice: number;
  premiumPrice: number;
}

export interface Quote {
  id: string;
  name: string;
  eventId?: string;
  createdAt: string;
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
  calculated: QuoteCalculation;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: InventoryCategory;
  currentAmount: number;
  unit: InventoryUnit;
  cost: number;
  lowStockThreshold: number;
  notes: string;
}

export interface Lead {
  id: string;
  contactName: string;
  businessOrVenue: string;
  email: string;
  instagram: string;
  phone: string;
  leadType: LeadType;
  status: LeadStatus;
  lastContactedDate: string;
  nextFollowUpDate: string;
  notes: string;
  potentialEventValue: number;
}

export interface PrepIngredientTotal {
  name: string;
  amountOz: number;
  cups: number;
  quarts: number;
  liters: number;
  gallons: number;
  inventoryAmountOz?: number;
  inventoryUnit?: InventoryUnit;
  warning?: string;
}

export interface PrepList {
  eventId: string;
  totalExpectedDrinks: number;
  drinksPerGuest: number;
  ingredientTotals: PrepIngredientTotal[];
  garnishCounts: { name: string; count: number }[];
  supplies: { item: string; count: number; warning?: string }[];
  icePounds: number;
  packList: string[];
  nightBeforeTasks: string[];
  dayOfTasks: string[];
  setupChecklist: string[];
}

export interface AppData {
  events: Event[];
  drinks: Drink[];
  inventory: InventoryItem[];
  quotes: Quote[];
  leads: Lead[];
}
