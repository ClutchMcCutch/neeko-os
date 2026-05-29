import { CalendarClock, Mail, Phone, Trash2 } from 'lucide-react';
import type { Lead, LeadStatus } from '../types';
import { currency } from '../utils/calculations';
import StatusBadge from './StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

const statuses: LeadStatus[] = [
  'new',
  'reached out',
  'responded',
  'meeting booked',
  'quote sent',
  'booked',
  'lost',
  'follow up later',
];

export default function LeadCard({ lead, onUpdate, onDelete }: LeadCardProps) {
  return (
    <article className="panel overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neeko-blue/70 via-neeko-gold/50 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-50">{lead.contactName}</h3>
            <StatusBadge label={lead.status} />
          </div>
          <p className="mt-1 text-sm text-stone-400">{lead.businessOrVenue}</p>
        </div>
        <button className="btn-ghost min-h-9 px-2 text-neeko-rose hover:text-neeko-rose" type="button" aria-label="Delete lead" onClick={() => onDelete(lead.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
        <span className="metric-tile inline-flex items-center gap-2">
          <Mail size={15} className="text-stone-500" />
          {lead.email}
        </span>
        <span className="metric-tile inline-flex items-center gap-2">
          <Phone size={15} className="text-stone-500" />
          {lead.phone}
        </span>
        <span className="metric-tile inline-flex items-center gap-2">
          <CalendarClock size={15} className="text-stone-500" />
          Follow up {lead.nextFollowUpDate}
        </span>
        <span className="metric-tile text-stone-400">{lead.instagram}</span>
      </div>

      <p className="note-box mt-3">{lead.notes}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="label">Status</span>
          <select className="field" value={lead.status} onChange={(e) => onUpdate({ ...lead, status: e.target.value as LeadStatus })}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="metric-tile">
          <p className="text-xs text-stone-500">Potential value</p>
          <p className="mt-1 font-semibold text-neeko-gold">{currency(lead.potentialEventValue)}</p>
        </div>
      </div>
    </article>
  );
}
