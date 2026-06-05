import PrepList from '../components/PrepList';
import type { Drink, Event as NeekoEvent, InventoryItem } from '../types';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { ClipboardList } from 'lucide-react';
import { inferInventoryCategory, sortInventoryItems } from '../utils/inventory';
import { makeId } from '../utils/storage';

interface PrepPageProps {
  events: NeekoEvent[];
  drinks: Drink[];
  inventory: InventoryItem[];
  onInventoryChange: (inventory: InventoryItem[]) => void;
}

export default function PrepPage({ events, drinks, inventory, onInventoryChange }: PrepPageProps) {
  const serviceEvents = events.filter(
    (event) => event.status !== 'canceled' && !(event.status === 'completed' && event.paymentStatus === 'paid'),
  );
  const [selectedEventId, setSelectedEventId] = useState(serviceEvents[0]?.id ?? '');
  const selectedEvent = serviceEvents.find((event) => event.id === selectedEventId) ?? serviceEvents[0];
  const addMissingInventoryItem = (itemName: string, amountOz: number) => {
    const alreadyTracked = inventory.some(
      (item) => item.itemName.trim().toLowerCase() === itemName.trim().toLowerCase(),
    );

    if (alreadyTracked) return;

    onInventoryChange(
      sortInventoryItems([
        ...inventory,
        {
          id: makeId('inventory'),
          itemName,
          category: inferInventoryCategory(itemName),
          currentAmount: 0,
          unit: 'oz',
          cost: 0,
          lowStockThreshold: Math.ceil(amountOz),
          notes: selectedEvent ? `Added from prep list for ${selectedEvent.eventName}.` : 'Added from prep list.',
        },
      ]),
    );
  };

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          eyebrow="Prep List Generator"
          title="Batching, packing, and service readiness"
          description="Turn selected drinks and guest count into ingredient totals, garnish counts, supply estimates, ice, and setup tasks."
          icon={ClipboardList}
          actions={
            <label className="space-y-1.5 sm:w-80">
          <span className="label">Selected event</span>
          <select className="field" value={selectedEvent?.id ?? ''} onChange={(e) => setSelectedEventId(e.target.value)}>
            {serviceEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.eventName}
              </option>
            ))}
          </select>
        </label>
          }
        />
      </div>

      {selectedEvent ? (
        <PrepList
          event={selectedEvent}
          drinks={drinks}
          inventory={inventory}
          onAddMissingInventoryItem={addMissingInventoryItem}
        />
      ) : (
        <section className="panel p-6 text-stone-400">Create an event before generating a prep list.</section>
      )}
    </div>
  );
}
