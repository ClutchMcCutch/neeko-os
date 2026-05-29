import DashboardCard from '../components/DashboardCard';
import InventoryTable from '../components/InventoryTable';
import PageHeader from '../components/PageHeader';
import type { InventoryItem } from '../types';
import { currency, lowInventoryItems } from '../utils/calculations';
import { AlertTriangle, Boxes, Download, WalletCards } from 'lucide-react';
import { orderSheetInventory } from '../data/orderSheetInventory';

interface InventoryPageProps {
  inventory: InventoryItem[];
  onInventoryChange: (inventory: InventoryItem[]) => void;
  onImportOrderSheet: () => void;
}

export default function InventoryPage({ inventory, onInventoryChange, onImportOrderSheet }: InventoryPageProps) {
  const lowStock = lowInventoryItems(inventory);
  const inventoryValue = inventory.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inventory Tracker"
        title="Stock levels and prep coverage"
        description="Monitor par levels for syrups, juices, kava, alcohol, garnish, cups, ice, and service supplies before each event."
        icon={Boxes}
        stats={[
          { label: 'Items', value: `${inventory.length}`, tone: 'blue' },
          { label: 'Low', value: `${lowStock.length}`, tone: lowStock.length ? 'rose' : 'mint' },
          { label: 'Spend', value: currency(inventoryValue), tone: 'gold' },
        ]}
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <DashboardCard title="Tracked items" value={`${inventory.length}`} detail="Ingredients, garnish, supplies" icon={<Boxes size={20} />} accent="blue" />
        <DashboardCard title="Low stock" value={`${lowStock.length}`} detail="At or below threshold" icon={<AlertTriangle size={20} />} accent={lowStock.length ? 'rose' : 'mint'} />
        <DashboardCard title="Inventory spend" value={currency(inventoryValue)} detail="Current recorded cost basis" icon={<WalletCards size={20} />} accent="gold" />
      </section>
      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Order Sheet Import</p>
          <p className="mt-1 text-sm text-stone-300">
            {orderSheetInventory.length} transcribed ingredients are loaded from your May 27 order sheet with zero on hand.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Re-importing refreshes matching sheet items at zero stock and keeps events, drinks, leads, and unrelated stock.
          </p>
        </div>
        <button className="btn-secondary shrink-0" type="button" onClick={onImportOrderSheet}>
          <Download size={17} />
          Re-import Sheet
        </button>
      </section>
      <InventoryTable items={inventory} onChange={onInventoryChange} />
    </div>
  );
}
