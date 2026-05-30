import type {
  BookkeepingData,
  BookkeepingExpense,
  BookkeepingSale,
  DrinkCostEntry,
  PayrollEntry,
  TipPoolEntry,
} from '../types';

export function calculateSale(entry: BookkeepingSale) {
  const netProfit = entry.revenue - entry.expenseAmount;
  const netProfitMargin = entry.revenue > 0 ? netProfit / entry.revenue : 0;
  const markup = entry.expenseAmount > 0 ? netProfit / entry.expenseAmount : 0;

  return {
    netProfit,
    netProfitMargin,
    markup,
  };
}

export function calculatePayrollTotal(entry: PayrollEntry) {
  const basePay = entry.shiftPay || entry.workedHours * entry.hourlyRate;
  return basePay + entry.tips;
}

export function calculateTipVariance(entry: TipPoolEntry) {
  return entry.totalTipOut - entry.totalTipIn;
}

export function calculateDrinkCost(entry: DrinkCostEntry) {
  const netProfit = entry.salePrice - entry.drinkCost;
  const markup = entry.drinkCost > 0 ? netProfit / entry.drinkCost : 0;
  const profitIndex = netProfit * markup;

  return {
    netProfit,
    markup,
    profitIndex,
  };
}

export function rankDrinkCosts(entries: DrinkCostEntry[]) {
  return entries
    .map((entry) => ({
      ...entry,
      calculated: calculateDrinkCost(entry),
    }))
    .sort((a, b) => b.calculated.profitIndex - a.calculated.profitIndex)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function bookkeepingSummary(bookkeeping: BookkeepingData) {
  const totalExpenses = sum(bookkeeping.expenses, (entry) => entry.amount);
  const totalRevenue = sum(bookkeeping.sales, (entry) => entry.revenue);
  const loggedSalesExpense = sum(bookkeeping.sales, (entry) => entry.expenseAmount);
  const netProfit = totalRevenue - loggedSalesExpense;
  const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
  const payrollTotal = sum(bookkeeping.payroll, calculatePayrollTotal);
  const tipOutTotal = sum(bookkeeping.tipPool, (entry) => entry.totalTipOut);
  const averageTicket =
    sum(bookkeeping.sales, (entry) =>
      typeof entry.transactions === 'number' ? entry.transactions : 0,
    ) > 0
      ? totalRevenue /
        sum(bookkeeping.sales, (entry) =>
          typeof entry.transactions === 'number' ? entry.transactions : 0,
        )
      : 0;

  return {
    totalExpenses,
    totalRevenue,
    loggedSalesExpense,
    netProfit,
    profitMargin,
    payrollTotal,
    tipOutTotal,
    averageTicket,
    expenseCount: bookkeeping.expenses.length,
    salesCount: bookkeeping.sales.length,
    payrollCount: bookkeeping.payroll.length,
    vendorCount: bookkeeping.vendorPrices.length,
    batchCount: bookkeeping.batches.length,
  };
}

export function groupExpensesByEvent(expenses: BookkeepingExpense[]) {
  const totals = new Map<string, number>();

  expenses.forEach((entry) => {
    const key = entry.eventCode || 'UNASSIGNED';
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });

  return Array.from(totals.entries())
    .map(([eventCode, amount]) => ({ eventCode, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupExpensesBySupplier(expenses: BookkeepingExpense[]) {
  const totals = new Map<string, number>();

  expenses.forEach((entry) => {
    const key = entry.supplier || entry.location || 'UNASSIGNED';
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });

  return Array.from(totals.entries())
    .map(([supplier, amount]) => ({ supplier, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySales(sales: BookkeepingSale[]) {
  const totals = new Map<string, { revenue: number; profit: number; expenses: number }>();

  sales.forEach((entry) => {
    const month = /^\d{4}-\d{2}/.test(entry.date) ? entry.date.slice(0, 7) : 'Undated';
    const existing = totals.get(month) ?? { revenue: 0, profit: 0, expenses: 0 };
    const calculated = calculateSale(entry);
    totals.set(month, {
      revenue: existing.revenue + entry.revenue,
      expenses: existing.expenses + entry.expenseAmount,
      profit: existing.profit + calculated.netProfit,
    });
  });

  return Array.from(totals.entries())
    .map(([month, totalsForMonth]) => ({ month, ...totalsForMonth }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function sum<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => {
    const value = getValue(item);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}
