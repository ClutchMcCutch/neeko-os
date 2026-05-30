import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Martini,
  Package,
  ReceiptText,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import WorkspaceDataControls from './components/WorkspaceDataControls';
import BookkeepingPage from './pages/BookkeepingPage';
import DashboardPage from './pages/DashboardPage';
import DrinksPage from './pages/DrinksPage';
import EventsPage from './pages/EventsPage';
import InventoryPage from './pages/InventoryPage';
import LeadsPage from './pages/LeadsPage';
import PrepPage from './pages/PrepPage';
import ProfitPage from './pages/ProfitPage';
import QuotesPage from './pages/QuotesPage';
import type { PageId } from './pageTypes';
import type { Quote } from './types';
import { quoteToEventPatch } from './utils/calculations';
import { usePersistentStore } from './utils/storage';

const navItems: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'drinks', label: 'Drinks', icon: Martini },
  { id: 'quotes', label: 'Quotes', icon: ReceiptText },
  { id: 'prep', label: 'Prep Lists', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'profit', label: 'Profit', icon: BarChart3 },
  { id: 'bookkeeping', label: 'Bookkeeping', icon: BookOpenCheck },
];

export default function App() {
  const {
    data,
    setData,
    resetData,
    importData,
    importOrderSheet,
    lastSavedAt,
    syncStatus,
    syncMessage,
    userEmail,
    isCloudConfigured,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  } = usePersistentStore();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const activeLabel = navItems.find((item) => item.id === activePage)?.label ?? 'Dashboard';

  const saveQuote = (quote: Quote) => {
    setData((current) => ({
      ...current,
      quotes: [quote, ...current.quotes.filter((item) => item.id !== quote.id)],
      events: quote.eventId
        ? current.events.map((event) =>
            event.id === quote.eventId ? { ...event, ...quoteToEventPatch(quote) } : event,
          )
        : current.events,
    }));
  };

  const renderPage = () => {
    switch (activePage) {
      case 'events':
        return (
          <EventsPage
            events={data.events}
            drinks={data.drinks}
            onEventsChange={(events) => setData((current) => ({ ...current, events }))}
          />
        );
      case 'drinks':
        return (
          <DrinksPage
            drinks={data.drinks}
            onDrinksChange={(drinks) => setData((current) => ({ ...current, drinks }))}
          />
        );
      case 'quotes':
        return <QuotesPage drinks={data.drinks} events={data.events} quotes={data.quotes} onSaveQuote={saveQuote} />;
      case 'prep':
        return <PrepPage events={data.events} drinks={data.drinks} inventory={data.inventory} />;
      case 'inventory':
        return (
          <InventoryPage
            inventory={data.inventory}
            onInventoryChange={(inventory) => setData((current) => ({ ...current, inventory }))}
            onImportOrderSheet={importOrderSheet}
          />
        );
      case 'leads':
        return (
          <LeadsPage
            leads={data.leads}
            onLeadsChange={(leads) => setData((current) => ({ ...current, leads }))}
          />
        );
      case 'profit':
        return <ProfitPage events={data.events} />;
      case 'bookkeeping':
        return (
          <BookkeepingPage
            bookkeeping={data.bookkeeping}
            onBookkeepingChange={(bookkeeping) => setData((current) => ({ ...current, bookkeeping }))}
          />
        );
      case 'dashboard':
      default:
        return <DashboardPage data={data} onNavigate={(page) => setActivePage(page as PageId)} />;
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="no-print border-b border-white/10 bg-ink-950/85 px-4 py-4 backdrop-blur-2xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(98,214,173,0.09),transparent_36%),linear-gradient(135deg,rgba(233,191,114,0.08),transparent_32%)]" />
        <div className="absolute inset-x-5 top-20 -z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center justify-between gap-3 lg:block">
          <button className="flex items-center gap-3 text-left" type="button" onClick={() => setActivePage('dashboard')}>
            <span className="grid h-12 w-12 place-items-center rounded-lg border border-neeko-mint/25 bg-[linear-gradient(135deg,rgba(98,214,173,0.22),rgba(233,191,114,0.10)),linear-gradient(135deg,rgba(255,255,255,0.11)_1px,transparent_1px)] bg-[length:auto,9px_9px] text-lg font-bold text-neeko-mint shadow-[0_18px_40px_rgba(98,214,173,0.12)]">
              N
            </span>
            <span>
              <span className="block text-base font-semibold text-stone-50">Neeko EventOS</span>
              <span className="block text-xs text-stone-500">Hospitality ops console</span>
            </span>
          </button>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                className={`flex min-h-10 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition lg:w-full ${
                  active
                    ? 'bg-gradient-to-r from-neeko-mint/[0.18] to-white/[0.06] text-stone-50 shadow-[inset_3px_0_0_rgba(98,214,173,0.8)]'
                    : 'text-stone-400 hover:bg-white/[0.06] hover:text-stone-100'
                }`}
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-md ${active ? 'bg-neeko-mint/15 text-neeko-mint' : 'bg-white/[0.045] text-stone-500'}`}>
                  <Icon size={16} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <WorkspaceDataControls
          data={data}
          lastSavedAt={lastSavedAt}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
          userEmail={userEmail}
          isCloudConfigured={isCloudConfigured}
          onImport={importData}
          onReset={resetData}
          onSignIn={signInWithEmail}
          onPasswordSignIn={signInWithPassword}
          onPasswordSignUp={signUpWithPassword}
          onSignOut={signOut}
        />
      </aside>

      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-7xl">
          <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="label">Neeko EventOS</p>
              <h1 className="mt-1 text-2xl font-semibold text-stone-50 sm:text-3xl">{activeLabel}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {syncStatus === 'synced'
                  ? 'Supabase synced'
                  : syncStatus === 'saving'
                    ? 'Saving cloud'
                    : 'Autosaved locally'}
              </div>
              <div className="rounded-full border border-neeko-mint/25 bg-neeko-mint/10 px-3 py-1.5 text-sm font-medium text-neeko-mint">
                {data.events.length} events
              </div>
            </div>
          </div>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
