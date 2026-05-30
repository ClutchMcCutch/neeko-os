import {
  Banknote,
  ClipboardList,
  DollarSign,
  HandCoins,
  PackageSearch,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  Wine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import DashboardCard from '../components/DashboardCard';
import PageHeader from '../components/PageHeader';
import type {
  BatchCostEntry,
  BookkeepingData,
  BookkeepingExpense,
  BookkeepingSale,
  BusinessResource,
  DrinkCostEntry,
  PayrollEntry,
  TipPoolEntry,
  VendorPriceEntry,
} from '../types';
import { currency, percent } from '../utils/calculations';
import {
  bookkeepingSummary,
  calculateDrinkCost,
  calculatePayrollTotal,
  calculateSale,
  calculateTipVariance,
  groupExpensesByEvent,
  groupExpensesBySupplier,
  monthlySales,
  rankDrinkCosts,
} from '../utils/bookkeeping';
import { makeId } from '../utils/storage';

type TabId = 'overview' | 'expenses' | 'sales' | 'payroll' | 'tips' | 'drinks' | 'batches' | 'vendors' | 'resources';

interface BookkeepingPageProps {
  bookkeeping: BookkeepingData;
  onBookkeepingChange: (bookkeeping: BookkeepingData) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'sales', label: 'Sales' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'tips', label: 'Tip Pool' },
  { id: 'drinks', label: 'Drink Costs' },
  { id: 'batches', label: 'Batches' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'resources', label: 'Resources' },
];

export default function BookkeepingPage({ bookkeeping, onBookkeepingChange }: BookkeepingPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const summary = useMemo(() => bookkeepingSummary(bookkeeping), [bookkeeping]);

  const update = <K extends keyof BookkeepingData>(key: K, value: BookkeepingData[K]) => {
    onBookkeepingChange({ ...bookkeeping, [key]: value });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Bookkeeping"
        title="Neeko operating ledger"
        description="Run the spreadsheet workflows inside EventOS: expenses, sales profit, payroll, tip pooling, drink costing, batches, vendors, and resource tracking."
        icon={Banknote}
        stats={[
          { label: 'Revenue', value: currency(summary.totalRevenue), tone: 'mint' },
          { label: 'Profit', value: currency(summary.netProfit), tone: 'gold' },
          { label: 'Margin', value: percent(summary.profitMargin), tone: 'blue' },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Logged expenses" value={currency(summary.totalExpenses)} detail={`${summary.expenseCount} expense rows`} icon={<ReceiptText size={20} />} accent="gold" />
        <DashboardCard title="Sales revenue" value={currency(summary.totalRevenue)} detail={`${summary.salesCount} sales rows`} icon={<DollarSign size={20} />} accent="mint" />
        <DashboardCard title="Payroll" value={currency(summary.payrollTotal)} detail={`${summary.payrollCount} staff pay rows`} icon={<Users size={20} />} accent="blue" />
        <DashboardCard title="Vendor prices" value={`${summary.vendorCount}`} detail={`${summary.batchCount} batch cost rows`} icon={<PackageSearch size={20} />} accent="rose" />
      </section>

      <nav className="no-print flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.035] p-1">
        {tabs.map((tab) => (
          <button
            className={`min-h-9 shrink-0 rounded-md px-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-neeko-mint/15 text-neeko-mint shadow-[inset_0_0_0_1px_rgba(98,214,173,0.35)]'
                : 'text-stone-400 hover:bg-white/[0.06] hover:text-stone-100'
            }`}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? <Overview bookkeeping={bookkeeping} /> : null}
      {activeTab === 'expenses' ? (
        <ExpensesTable
          expenses={bookkeeping.expenses}
          onChange={(expenses) => update('expenses', expenses)}
        />
      ) : null}
      {activeTab === 'sales' ? (
        <SalesTable sales={bookkeeping.sales} onChange={(sales) => update('sales', sales)} />
      ) : null}
      {activeTab === 'payroll' ? (
        <PayrollTable payroll={bookkeeping.payroll} onChange={(payroll) => update('payroll', payroll)} />
      ) : null}
      {activeTab === 'tips' ? (
        <TipPoolTable tipPool={bookkeeping.tipPool} onChange={(tipPool) => update('tipPool', tipPool)} />
      ) : null}
      {activeTab === 'drinks' ? (
        <DrinkCostTable drinkCosts={bookkeeping.drinkCosts} onChange={(drinkCosts) => update('drinkCosts', drinkCosts)} />
      ) : null}
      {activeTab === 'batches' ? (
        <BatchTable batches={bookkeeping.batches} onChange={(batches) => update('batches', batches)} />
      ) : null}
      {activeTab === 'vendors' ? (
        <VendorTable vendorPrices={bookkeeping.vendorPrices} onChange={(vendorPrices) => update('vendorPrices', vendorPrices)} />
      ) : null}
      {activeTab === 'resources' ? (
        <ResourcesTable resources={bookkeeping.resources} onChange={(resources) => update('resources', resources)} />
      ) : null}
    </div>
  );
}

function Overview({ bookkeeping }: { bookkeeping: BookkeepingData }) {
  const summary = bookkeepingSummary(bookkeeping);
  const eventExpenses = groupExpensesByEvent(bookkeeping.expenses).slice(0, 8);
  const supplierExpenses = groupExpensesBySupplier(bookkeeping.expenses).slice(0, 8);
  const salesTrend = monthlySales(bookkeeping.sales).slice(-10);
  const topDrinks = rankDrinkCosts(bookkeeping.drinkCosts).filter((entry) => entry.salePrice > 0).slice(0, 8);
  const maxMonthRevenue = Math.max(...salesTrend.map((entry) => entry.revenue), 1);
  const maxEventExpense = Math.max(...eventExpenses.map((entry) => entry.amount), 1);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="panel p-4">
        <PanelTitle icon={DollarSign} label="Sales Pulse" title="Revenue and profit by month" />
        <div className="mt-4 space-y-3">
          {salesTrend.map((entry) => (
            <div key={entry.month}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-200">{entry.month}</span>
                <span className="text-stone-400">{currency(entry.revenue)} revenue - {currency(entry.profit)} profit</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neeko-mint to-neeko-blue"
                  style={{ width: `${Math.max((entry.revenue / maxMonthRevenue) * 100, 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <PanelTitle icon={ReceiptText} label="Expense Pressure" title="Top event cost buckets" />
        <div className="mt-4 space-y-3">
          {eventExpenses.map((entry) => (
            <div className="premium-row" key={entry.eventCode}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-stone-100">{entry.eventCode}</span>
                <span className="text-stone-400">{currency(entry.amount)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neeko-gold to-neeko-rose"
                  style={{ width: `${Math.max((entry.amount / maxEventExpense) * 100, 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <PanelTitle icon={Wine} label="Drink Profitability" title="Top costed menu items" />
        <div className="mt-4 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Drink</th>
                <th>Type</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Net</th>
                <th>Markup</th>
              </tr>
            </thead>
            <tbody>
              {topDrinks.map((entry) => (
                <tr key={entry.id}>
                  <td>#{entry.rank}</td>
                  <td className="font-semibold text-stone-100">{entry.drinkName}</td>
                  <td className="capitalize">{entry.category}</td>
                  <td>{currency(entry.drinkCost)}</td>
                  <td>{currency(entry.salePrice)}</td>
                  <td>{currency(entry.calculated.netProfit)}</td>
                  <td>{percent(entry.calculated.markup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-4">
        <PanelTitle icon={PackageSearch} label="Vendor Spend" title="Top suppliers from expense log" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {supplierExpenses.map((entry) => (
            <div className="metric-tile" key={entry.supplier}>
              <p className="truncate text-sm font-semibold text-stone-100">{entry.supplier}</p>
              <p className="mt-1 text-lg font-semibold text-neeko-gold">{currency(entry.amount)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-stone-400">
          Tip outs logged: <span className="font-semibold text-stone-100">{currency(summary.tipOutTotal)}</span>. Payroll and tip pool can be edited separately, just like the workbook.
        </div>
      </section>
    </div>
  );
}

function ExpensesTable({ expenses, onChange }: { expenses: BookkeepingExpense[]; onChange: (expenses: BookkeepingExpense[]) => void }) {
  const rows = [...expenses].sort((a, b) => b.soldDate.localeCompare(a.soldDate));
  return (
    <EditableTable
      title="Expense log"
      label="Workbook: EXPENSES"
      icon={ReceiptText}
      onAdd={() =>
        onChange([
          {
            id: makeId('expense'),
            item: 'New expense',
            preparedDate: today(),
            soldDate: today(),
            location: '',
            eventCode: '',
            supplier: '',
            amount: 0,
            notes: '',
          },
          ...expenses,
        ])
      }
    >
      <table className="data-table min-w-[980px]">
        <thead>
          <tr>
            <th>Sold date</th>
            <th>Item</th>
            <th>Location</th>
            <th>Event</th>
            <th>Supplier</th>
            <th>Amount</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.id}>
              <td><TextInput type="date" value={entry.soldDate} onChange={(value) => patch(expenses, onChange, entry.id, { soldDate: value })} /></td>
              <td><TextInput value={entry.item} onChange={(value) => patch(expenses, onChange, entry.id, { item: value })} /></td>
              <td><TextInput value={entry.location} onChange={(value) => patch(expenses, onChange, entry.id, { location: value })} /></td>
              <td><TextInput value={entry.eventCode} onChange={(value) => patch(expenses, onChange, entry.id, { eventCode: value })} /></td>
              <td><TextInput value={entry.supplier} onChange={(value) => patch(expenses, onChange, entry.id, { supplier: value })} /></td>
              <td><NumberInput value={entry.amount} onChange={(value) => patch(expenses, onChange, entry.id, { amount: value })} /></td>
              <td><TextInput value={entry.notes} onChange={(value) => patch(expenses, onChange, entry.id, { notes: value })} /></td>
              <td><DeleteButton onClick={() => remove(expenses, onChange, entry.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </EditableTable>
  );
}

function SalesTable({ sales, onChange }: { sales: BookkeepingSale[]; onChange: (sales: BookkeepingSale[]) => void }) {
  const rows = [...sales].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <EditableTable
      title="Event sales and profit"
      label="Workbook: SALES DATA"
      icon={DollarSign}
      onAdd={() =>
        onChange([
          {
            id: makeId('sale'),
            date: today(),
            expenseAmount: 0,
            transactions: 0,
            revenue: 0,
            notes: '',
            eventCode: '',
          },
          ...sales,
        ])
      }
    >
      <table className="data-table min-w-[1080px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Transactions</th>
            <th>Revenue</th>
            <th>Expense</th>
            <th>Net profit</th>
            <th>Margin</th>
            <th>Markup</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const calculated = calculateSale(entry);
            return (
              <tr key={entry.id}>
                <td><TextInput type="date" value={entry.date} onChange={(value) => patch(sales, onChange, entry.id, { date: value })} /></td>
                <td><TextInput value={entry.eventCode} onChange={(value) => patch(sales, onChange, entry.id, { eventCode: value })} /></td>
                <td><TextInput value={`${entry.transactions}`} onChange={(value) => patch(sales, onChange, entry.id, { transactions: numericOrText(value) })} /></td>
                <td><NumberInput value={entry.revenue} onChange={(value) => patch(sales, onChange, entry.id, { revenue: value })} /></td>
                <td><NumberInput value={entry.expenseAmount} onChange={(value) => patch(sales, onChange, entry.id, { expenseAmount: value })} /></td>
                <td className={calculated.netProfit >= 0 ? 'font-semibold text-neeko-mint' : 'font-semibold text-neeko-rose'}>{currency(calculated.netProfit)}</td>
                <td>{percent(calculated.netProfitMargin)}</td>
                <td>{percent(calculated.markup)}</td>
                <td><TextInput value={entry.notes} onChange={(value) => patch(sales, onChange, entry.id, { notes: value })} /></td>
                <td><DeleteButton onClick={() => remove(sales, onChange, entry.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </EditableTable>
  );
}

function PayrollTable({ payroll, onChange }: { payroll: PayrollEntry[]; onChange: (payroll: PayrollEntry[]) => void }) {
  const rows = [...payroll].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <EditableTable
      title="Payroll"
      label="Workbook: PAYROLL"
      icon={Users}
      onAdd={() =>
        onChange([
          {
            id: makeId('payroll'),
            date: today(),
            firstName: '',
            lastName: '',
            position: 'Bartender',
            department: 'FOH',
            workedHours: 0,
            hourlyRate: 0,
            shiftPay: 0,
            tips: 0,
          },
          ...payroll,
        ])
      }
    >
      <table className="data-table min-w-[980px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>First</th>
            <th>Last</th>
            <th>Position</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Shift pay</th>
            <th>Tips</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.id}>
              <td><TextInput type="date" value={entry.date} onChange={(value) => patch(payroll, onChange, entry.id, { date: value })} /></td>
              <td><TextInput value={entry.firstName} onChange={(value) => patch(payroll, onChange, entry.id, { firstName: value })} /></td>
              <td><TextInput value={entry.lastName} onChange={(value) => patch(payroll, onChange, entry.id, { lastName: value })} /></td>
              <td><TextInput value={entry.position} onChange={(value) => patch(payroll, onChange, entry.id, { position: value })} /></td>
              <td><NumberInput value={entry.workedHours} onChange={(value) => patch(payroll, onChange, entry.id, { workedHours: value })} /></td>
              <td><NumberInput value={entry.hourlyRate} onChange={(value) => patch(payroll, onChange, entry.id, { hourlyRate: value })} /></td>
              <td><NumberInput value={entry.shiftPay} onChange={(value) => patch(payroll, onChange, entry.id, { shiftPay: value })} /></td>
              <td><NumberInput value={entry.tips} onChange={(value) => patch(payroll, onChange, entry.id, { tips: value })} /></td>
              <td className="font-semibold text-stone-100">{currency(calculatePayrollTotal(entry))}</td>
              <td><DeleteButton onClick={() => remove(payroll, onChange, entry.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </EditableTable>
  );
}

function TipPoolTable({ tipPool, onChange }: { tipPool: TipPoolEntry[]; onChange: (tipPool: TipPoolEntry[]) => void }) {
  const rows = [...tipPool].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <EditableTable
      title="Tip pool"
      label="Workbook: TIPOUT POOL"
      icon={HandCoins}
      onAdd={() =>
        onChange([
          {
            id: makeId('tip'),
            date: today(),
            firstName: '',
            lastName: '',
            position: 'Bartender',
            department: 'FOH',
            workedHours: 0,
            creditTips: 0,
            tipSharePercent: 1,
            totalTipIn: 0,
            totalTipOut: 0,
          },
          ...tipPool,
        ])
      }
    >
      <table className="data-table min-w-[1120px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>First</th>
            <th>Last</th>
            <th>Hours</th>
            <th>Credit tips</th>
            <th>Share</th>
            <th>Tip-in</th>
            <th>Tip-out</th>
            <th>Variance</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const variance = calculateTipVariance(entry);
            return (
              <tr key={entry.id}>
                <td><TextInput type="date" value={entry.date} onChange={(value) => patch(tipPool, onChange, entry.id, { date: value })} /></td>
                <td><TextInput value={entry.firstName} onChange={(value) => patch(tipPool, onChange, entry.id, { firstName: value })} /></td>
                <td><TextInput value={entry.lastName} onChange={(value) => patch(tipPool, onChange, entry.id, { lastName: value })} /></td>
                <td><NumberInput value={entry.workedHours} onChange={(value) => patch(tipPool, onChange, entry.id, { workedHours: value })} /></td>
                <td><NumberInput value={entry.creditTips} onChange={(value) => patch(tipPool, onChange, entry.id, { creditTips: value })} /></td>
                <td><NumberInput value={entry.tipSharePercent} onChange={(value) => patch(tipPool, onChange, entry.id, { tipSharePercent: value })} /></td>
                <td><NumberInput value={entry.totalTipIn} onChange={(value) => patch(tipPool, onChange, entry.id, { totalTipIn: value })} /></td>
                <td><NumberInput value={entry.totalTipOut} onChange={(value) => patch(tipPool, onChange, entry.id, { totalTipOut: value })} /></td>
                <td className={variance >= 0 ? 'text-neeko-mint' : 'text-neeko-rose'}>{currency(variance)}</td>
                <td><DeleteButton onClick={() => remove(tipPool, onChange, entry.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </EditableTable>
  );
}

function DrinkCostTable({ drinkCosts, onChange }: { drinkCosts: DrinkCostEntry[]; onChange: (drinkCosts: DrinkCostEntry[]) => void }) {
  const ranked = rankDrinkCosts(drinkCosts);
  return (
    <EditableTable
      title="Drink costing and rankings"
      label="Workbook: COST PER DRINK"
      icon={Wine}
      onAdd={() =>
        onChange([
          {
            id: makeId('drinkcost'),
            drinkName: 'New drink',
            category: 'na-spirit',
            drinkCost: 0,
            unitAmount: 1,
            salePrice: 0,
          },
          ...drinkCosts,
        ])
      }
    >
      <table className="data-table min-w-[980px]">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Drink</th>
            <th>Type</th>
            <th>Cost</th>
            <th>Units</th>
            <th>Sale price</th>
            <th>Net</th>
            <th>Markup</th>
            <th>Index</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => {
            const calculated = calculateDrinkCost(entry);
            return (
              <tr key={entry.id}>
                <td>#{entry.rank}</td>
                <td><TextInput value={entry.drinkName} onChange={(value) => patch(drinkCosts, onChange, entry.id, { drinkName: value })} /></td>
                <td>
                  <select className="field min-w-32" value={entry.category} onChange={(event) => patch(drinkCosts, onChange, entry.id, { category: event.target.value as DrinkCostEntry['category'] })}>
                    <option value="na-spirit">NA spirit</option>
                    <option value="non-spirit">Non-spirit</option>
                  </select>
                </td>
                <td><NumberInput value={entry.drinkCost} onChange={(value) => patch(drinkCosts, onChange, entry.id, { drinkCost: value })} /></td>
                <td><NumberInput value={entry.unitAmount} onChange={(value) => patch(drinkCosts, onChange, entry.id, { unitAmount: value })} /></td>
                <td><NumberInput value={entry.salePrice} onChange={(value) => patch(drinkCosts, onChange, entry.id, { salePrice: value })} /></td>
                <td className="font-semibold text-neeko-mint">{currency(calculated.netProfit)}</td>
                <td>{percent(calculated.markup)}</td>
                <td>{calculated.profitIndex.toFixed(1)}</td>
                <td><DeleteButton onClick={() => remove(drinkCosts, onChange, entry.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </EditableTable>
  );
}

function BatchTable({ batches, onChange }: { batches: BatchCostEntry[]; onChange: (batches: BatchCostEntry[]) => void }) {
  return (
    <EditableTable
      title="Batch costing"
      label="Workbook: BATCHES"
      icon={ClipboardList}
      onAdd={() =>
        onChange([
          {
            id: makeId('batch'),
            batchName: 'New batch',
            nonSpiritCost: 0,
            spiritCost: 0,
            unitAmount: '',
            spiritBatchName: '',
            spiritOne: '',
            spiritOneMl: 0,
            spiritOneCostPerBottle: 0,
            spiritTwo: '',
            spiritTwoMl: 0,
            spiritTwoCostPerBottle: 0,
            totalMl: 0,
            totalBatchCost: 0,
          },
          ...batches,
        ])
      }
    >
      <table className="data-table min-w-[1220px]">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Non-spirit cost</th>
            <th>Unit amount</th>
            <th>Spirit batch</th>
            <th>Spirit 1</th>
            <th>ML</th>
            <th>Spirit 2</th>
            <th>ML 2</th>
            <th>Total ML</th>
            <th>Total cost</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {batches.map((entry) => (
            <tr key={entry.id}>
              <td><TextInput value={entry.batchName} onChange={(value) => patch(batches, onChange, entry.id, { batchName: value })} /></td>
              <td><NumberInput value={entry.nonSpiritCost} onChange={(value) => patch(batches, onChange, entry.id, { nonSpiritCost: value })} /></td>
              <td><TextInput value={entry.unitAmount} onChange={(value) => patch(batches, onChange, entry.id, { unitAmount: value })} /></td>
              <td><TextInput value={entry.spiritBatchName} onChange={(value) => patch(batches, onChange, entry.id, { spiritBatchName: value })} /></td>
              <td><TextInput value={entry.spiritOne} onChange={(value) => patch(batches, onChange, entry.id, { spiritOne: value })} /></td>
              <td><NumberInput value={entry.spiritOneMl} onChange={(value) => patch(batches, onChange, entry.id, { spiritOneMl: value })} /></td>
              <td><TextInput value={entry.spiritTwo} onChange={(value) => patch(batches, onChange, entry.id, { spiritTwo: value })} /></td>
              <td><NumberInput value={entry.spiritTwoMl} onChange={(value) => patch(batches, onChange, entry.id, { spiritTwoMl: value })} /></td>
              <td><NumberInput value={entry.totalMl} onChange={(value) => patch(batches, onChange, entry.id, { totalMl: value })} /></td>
              <td><NumberInput value={entry.totalBatchCost} onChange={(value) => patch(batches, onChange, entry.id, { totalBatchCost: value })} /></td>
              <td><DeleteButton onClick={() => remove(batches, onChange, entry.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </EditableTable>
  );
}

function VendorTable({ vendorPrices, onChange }: { vendorPrices: VendorPriceEntry[]; onChange: (vendorPrices: VendorPriceEntry[]) => void }) {
  const [filter, setFilter] = useState('');
  const visibleRows = vendorPrices.filter((entry) =>
    [entry.itemName, entry.brand, entry.orderFrom, entry.costPerPortion].join(' ').toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <EditableTable
      title="Vendor price sheet"
      label="Workbook: VENDOR SHEETS"
      icon={PackageSearch}
      actions={<input className="field max-w-xs" placeholder="Search vendor sheet" value={filter} onChange={(event) => setFilter(event.target.value)} />}
      onAdd={() =>
        onChange([
          {
            id: makeId('vendor'),
            itemName: 'New item',
            brand: '',
            orderFrom: '',
            size: '',
            price: 0,
            linkLabel: '',
            costPerPortion: '',
            kind: 'ingredient',
          },
          ...vendorPrices,
        ])
      }
    >
      <table className="data-table min-w-[1120px]">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Item</th>
            <th>Brand</th>
            <th>Order from</th>
            <th>Size</th>
            <th>Price</th>
            <th>Cost/portion</th>
            <th>Link label</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((entry) => (
            <tr key={entry.id}>
              <td>
                <select className="field min-w-32" value={entry.kind} onChange={(event) => patch(vendorPrices, onChange, entry.id, { kind: event.target.value as VendorPriceEntry['kind'] })}>
                  <option value="ingredient">Ingredient</option>
                  <option value="spirit">Spirit</option>
                </select>
              </td>
              <td><TextInput value={entry.itemName} onChange={(value) => patch(vendorPrices, onChange, entry.id, { itemName: value })} /></td>
              <td><TextInput value={entry.brand} onChange={(value) => patch(vendorPrices, onChange, entry.id, { brand: value })} /></td>
              <td><TextInput value={entry.orderFrom} onChange={(value) => patch(vendorPrices, onChange, entry.id, { orderFrom: value })} /></td>
              <td><TextInput value={entry.size} onChange={(value) => patch(vendorPrices, onChange, entry.id, { size: value })} /></td>
              <td><NumberInput value={entry.price} onChange={(value) => patch(vendorPrices, onChange, entry.id, { price: value })} /></td>
              <td><TextInput value={entry.costPerPortion} onChange={(value) => patch(vendorPrices, onChange, entry.id, { costPerPortion: value })} /></td>
              <td><TextInput value={entry.linkLabel} onChange={(value) => patch(vendorPrices, onChange, entry.id, { linkLabel: value })} /></td>
              <td><DeleteButton onClick={() => remove(vendorPrices, onChange, entry.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </EditableTable>
  );
}

function ResourcesTable({ resources, onChange }: { resources: BusinessResource[]; onChange: (resources: BusinessResource[]) => void }) {
  return (
    <EditableTable
      title="Business resources"
      label="Workbook: ACCOUNTS, sanitized"
      icon={Banknote}
      onAdd={() =>
        onChange([
          {
            id: makeId('resource'),
            accountFor: 'New resource',
            usedFor: '',
            email: '',
            notes: 'Store passwords in a password manager, not EventOS.',
          },
          ...resources,
        ])
      }
    >
      <div className="mb-4 rounded-md border border-neeko-gold/25 bg-neeko-gold/10 p-3 text-sm text-stone-300">
        Password fields from the workbook were intentionally left out. EventOS syncs through browser storage and Supabase, so this area is for account references, emails, notes, and ownership only.
      </div>
      <table className="data-table min-w-[820px]">
        <thead>
          <tr>
            <th>Account</th>
            <th>Used for</th>
            <th>Email</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {resources.map((entry) => (
            <tr key={entry.id}>
              <td><TextInput value={entry.accountFor} onChange={(value) => patch(resources, onChange, entry.id, { accountFor: value })} /></td>
              <td><TextInput value={entry.usedFor} onChange={(value) => patch(resources, onChange, entry.id, { usedFor: value })} /></td>
              <td><TextInput value={entry.email} onChange={(value) => patch(resources, onChange, entry.id, { email: value })} /></td>
              <td><TextInput value={entry.notes} onChange={(value) => patch(resources, onChange, entry.id, { notes: value })} /></td>
              <td><DeleteButton onClick={() => remove(resources, onChange, entry.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </EditableTable>
  );
}

function EditableTable({
  title,
  label,
  icon: Icon,
  children,
  actions,
  onAdd,
}: {
  title: string;
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  onAdd: () => void;
}) {
  return (
    <section className="panel overflow-hidden p-4">
      <div className="section-heading">
        <PanelTitle icon={Icon} label={label} title={title} />
        <div className="flex flex-wrap gap-2">
          {actions}
          <button className="btn-primary" type="button" onClick={onAdd}>
            <Plus size={17} />
            Add row
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function PanelTitle({ icon: Icon, label, title }: { icon: LucideIcon; label: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-md border border-neeko-mint/25 bg-neeko-mint/10 text-neeko-mint">
        <Icon size={18} />
      </span>
      <div>
        <p className="label">{label}</p>
        <h2 className="text-lg font-semibold text-stone-50">{title}</h2>
      </div>
    </div>
  );
}

function TextInput({ value, onChange, type = 'text' }: { value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <input
      className="field min-w-32"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      className="field min-w-28"
      type="number"
      step="0.01"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-ghost min-h-9 px-2 text-neeko-rose hover:text-neeko-rose" type="button" onClick={onClick} aria-label="Delete row">
      <Trash2 size={16} />
    </button>
  );
}

function patch<T extends { id: string }>(items: T[], onChange: (items: T[]) => void, id: string, patchValue: Partial<T>) {
  onChange(items.map((item) => (item.id === id ? { ...item, ...patchValue } : item)));
}

function remove<T extends { id: string }>(items: T[], onChange: (items: T[]) => void, id: string) {
  onChange(items.filter((item) => item.id !== id));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function numericOrText(value: string) {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : value;
}
