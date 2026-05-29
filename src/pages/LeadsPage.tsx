import { Plus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import LeadCard from '../components/LeadCard';
import PageHeader from '../components/PageHeader';
import type { Lead, LeadStatus, LeadType } from '../types';
import { currency } from '../utils/calculations';
import { makeId } from '../utils/storage';

interface LeadsPageProps {
  leads: Lead[];
  onLeadsChange: (leads: Lead[]) => void;
}

const leadTypes: LeadType[] = [
  'wedding planner',
  'venue',
  'bar',
  'restaurant',
  'market',
  'private client',
  'other',
];

const leadStatuses: LeadStatus[] = [
  'new',
  'reached out',
  'responded',
  'meeting booked',
  'quote sent',
  'booked',
  'lost',
  'follow up later',
];

function emptyLead(): Lead {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: makeId('lead'),
    contactName: '',
    businessOrVenue: '',
    email: '',
    instagram: '',
    phone: '',
    leadType: 'private client',
    status: 'new',
    lastContactedDate: today,
    nextFollowUpDate: today,
    notes: '',
    potentialEventValue: 2500,
  };
}

export default function LeadsPage({ leads, onLeadsChange }: LeadsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Lead>(emptyLead);
  const pipelineValue = leads
    .filter((lead) => !['booked', 'lost'].includes(lead.status))
    .reduce((sum, lead) => sum + lead.potentialEventValue, 0);

  const update = <K extends keyof Lead>(field: K, value: Lead[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLeadsChange([draft, ...leads]);
    setDraft(emptyLead());
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Leads / CRM"
        title="Outreach, follow-ups, and opportunity value"
        description="Track planners, venues, private clients, and partnership leads with next steps and potential event value."
        icon={Users}
        stats={[
          { label: 'Leads', value: `${leads.length}`, tone: 'blue' },
          { label: 'Active', value: `${leads.filter((lead) => !['booked', 'lost'].includes(lead.status)).length}`, tone: 'mint' },
          { label: 'Pipeline', value: currency(pipelineValue), tone: 'gold' },
        ]}
        actions={
          <button className="btn-primary" type="button" onClick={() => setShowForm(true)}>
            <Plus size={17} />
            New Lead
          </button>
        }
      />

      {showForm ? (
        <form className="panel overflow-hidden p-0" onSubmit={submit}>
          <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="label">New Lead</p>
              <h2 className="mt-1 text-xl font-semibold text-stone-50">Relationship and follow-up details</h2>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn-primary" type="submit">
                Save Lead
              </button>
            </div>
          </div>
          <section className="section-shell m-4">
          <div className="form-grid">
            <label className="space-y-1.5">
              <span className="label">Contact name</span>
              <input className="field" value={draft.contactName} onChange={(e) => update('contactName', e.target.value)} required />
            </label>
            <label className="space-y-1.5">
              <span className="label">Business / venue</span>
              <input className="field" value={draft.businessOrVenue} onChange={(e) => update('businessOrVenue', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Email</span>
              <input className="field" type="email" value={draft.email} onChange={(e) => update('email', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Instagram</span>
              <input className="field" value={draft.instagram} onChange={(e) => update('instagram', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Phone</span>
              <input className="field" value={draft.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Lead type</span>
              <select className="field" value={draft.leadType} onChange={(e) => update('leadType', e.target.value as LeadType)}>
                {leadTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="label">Status</span>
              <select className="field" value={draft.status} onChange={(e) => update('status', e.target.value as LeadStatus)}>
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="label">Potential value</span>
              <input className="field" type="number" min={0} value={draft.potentialEventValue} onChange={(e) => update('potentialEventValue', Number(e.target.value))} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Last contacted</span>
              <input className="field" type="date" value={draft.lastContactedDate} onChange={(e) => update('lastContactedDate', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="label">Next follow-up</span>
              <input className="field" type="date" value={draft.nextFollowUpDate} onChange={(e) => update('nextFollowUpDate', e.target.value)} />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="label">Notes</span>
              <input className="field" value={draft.notes} onChange={(e) => update('notes', e.target.value)} />
            </label>
          </div>
          </section>
        </form>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onUpdate={(updatedLead) => onLeadsChange(leads.map((item) => (item.id === updatedLead.id ? updatedLead : item)))}
            onDelete={(id) => onLeadsChange(leads.filter((item) => item.id !== id))}
          />
        ))}
      </section>
    </div>
  );
}
