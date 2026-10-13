'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Star, Plane, Building2, MapPin, 
  CheckCircle2, AlertCircle, Plus, Receipt, UserCheck, Bell
} from 'lucide-react';
import { ExpenseModal, GroupExpense } from './ExpenseModal';
import { EventModal, ItineraryItem } from './EventModal';
import { formatToINR, toDDMMYYYY } from '@/lib/formatters';

interface TravelerDoc {
  id: string;
  full_name: string;
  initials: string;
  isMe: boolean;
  docsVerified: number;
  docsTotal: number;
  status: 'ready' | 'pending';
}

interface CoordinatorHubClientProps {
  trip: {
    id: string;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    group_budget_inr: number | null;
  };
  travelers: any[];
  initialTravelerDocs: TravelerDoc[];
}

export function CoordinatorHubClient({
  trip,
  travelers,
  initialTravelerDocs,
}: CoordinatorHubClientProps) {
  // 1. Team arrival state
  const [teamArrived, setTeamArrived] = useState(false);
  const [arrivalToast, setArrivalToast] = useState('');

  // 2. Reminder state
  const [reminderToast, setReminderToast] = useState('');

  // 3. Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // 4. Expenses state
  const [expenses, setExpenses] = useState<GroupExpense[]>([
    { id: '1', date: '2026-09-20', category: 'Accommodation', vendor: 'Hotel Deposit (4 Rooms)', amount: 40000 },
    { id: '2', date: '2026-09-21', category: 'Dining', vendor: 'Team Dinner at Burj Khalifa', amount: 10000 },
  ]);

  // 5. Itinerary state
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { id: '1', time: '09:00', date: '20 Sept', title: 'Flight EK501 Departure', desc: 'Terminal 3. Meet at gate.', color: 'bg-brand-blue' },
    { id: '2', time: '14:00', date: '20 Sept', title: 'Hotel Check-in', desc: 'JW Marriott Marquis Dubai', color: 'bg-purple-500' },
  ]);

  // Calculations
  const groupSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const groupBudget = trip.group_budget_inr || 200000;
  const budgetPct = groupBudget > 0 ? Math.min(100, Math.round((groupSpent / groupBudget) * 100)) : 0;
  const allReady = initialTravelerDocs.every(t => t.status === 'ready');

  const handleAddExpense = (newExp: Omit<GroupExpense, 'id'>) => {
    const expenseWithId: GroupExpense = {
      ...newExp,
      id: Date.now().toString(),
    };
    setExpenses(prev => [expenseWithId, ...prev]);
  };

  const handleAddEvent = (newEvent: Omit<ItineraryItem, 'id'>) => {
    const eventWithId: ItineraryItem = {
      ...newEvent,
      id: Date.now().toString(),
    };
    setItinerary(prev => [...prev, eventWithId]);
  };

  const handleToggleArrival = () => {
    const nextState = !teamArrived;
    setTeamArrived(nextState);
    const msg = nextState
      ? 'Team marked as safely arrived at destination! All travelers notified.'
      : 'Team arrival status reset to pending.';
    setArrivalToast(msg);
    setTimeout(() => setArrivalToast(''), 4500);
  };

  const handleRemindTravelers = () => {
    const pendingNames = initialTravelerDocs
      .filter(t => t.status !== 'ready')
      .map(t => t.full_name)
      .join(', ');
    setReminderToast(`Document reminder notifications sent to: ${pendingNames || 'all pending travelers'}.`);
    setTimeout(() => setReminderToast(''), 4500);
  };

  return (
    <div className="-mx-4 md:-mx-8 -my-8 font-sans">
      {/* Toast Feedback */}
      {(arrivalToast || reminderToast) && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-green-50 text-status-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm text-primary-dark font-medium">
            {arrivalToast || reminderToast}
          </div>
        </div>
      )}

      {/* Sub Header / Trip Context */}
      <div className="bg-purple-900 text-white py-6 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/employee/dashboard" className="text-purple-300 text-sm font-medium hover:text-white mb-4 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mt-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-800 text-purple-200 text-xs font-semibold mb-3 border border-purple-700">
                <Star className="w-3.5 h-3.5 text-accent-gold" /> Coordinator Hub
              </span>
              <h2 className="text-3xl font-bold mb-1">{trip.title}</h2>
              <p className="text-purple-200 flex flex-wrap items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                <span className="flex items-center gap-1">
                  <Plane className="w-4 h-4" /> 
                  {toDDMMYYYY(trip.start_date)} - {toDDMMYYYY(trip.end_date)}
                </span>
                <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" /> {travelers.length} Travelers</span>
              </p>
            </div>
            
            {/* Group Budget Snapshot */}
            <div className="bg-purple-800/50 border border-purple-700 rounded-xl p-4 min-w-[250px] lg:min-w-[300px]">
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider mb-1">Group Budget Available</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-white">₹{formatToINR(groupSpent)}</span>
                <span className="text-sm text-purple-300 mb-1">/ ₹{formatToINR(groupBudget)}</span>
              </div>
              <div className="w-full bg-purple-900 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${groupSpent > groupBudget ? 'bg-red-500' : 'bg-accent-gold'}`} 
                  style={{ width: `${budgetPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Checklists & Safety */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Safety Check-in */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-primary-dark mb-4 flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${teamArrived ? 'text-status-green' : 'text-slate-400'}`} />
                Safety Check-in
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {teamArrived
                  ? 'All travelers have safely arrived at destination.'
                  : 'Mark all travelers as safely arrived at the destination.'}
              </p>
              <button 
                onClick={handleToggleArrival}
                className={`w-full py-3 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  teamArrived
                    ? 'bg-green-100 text-status-green hover:bg-green-200 border border-green-300'
                    : 'bg-status-green text-white hover:bg-green-600'
                }`}
              >
                <MapPin className="w-5 h-5" />
                {teamArrived ? 'Arrival Confirmed (Click to Reset)' : 'Log Team Arrival'}
              </button>
            </div>

            {/* Document Readiness */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-primary-dark">Team Readiness</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${allReady ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {allReady ? 'Ready' : 'Pending'}
                </span>
              </div>
              
              <div className="space-y-4">
                {initialTravelerDocs.map(t => (
                  <div key={t.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                        {t.initials}
                      </div>
                      <span className="text-sm font-medium text-primary-dark">{t.full_name} {t.isMe && '(You)'}</span>
                    </div>
                    <span className={`text-xs font-bold ${t.status === 'ready' ? 'text-status-green' : 'text-status-orange'}`}>
                      {t.status === 'ready' ? 'Ready' : `${t.docsVerified}/${t.docsTotal} Docs`}
                    </span>
                  </div>
                ))}
              </div>
              {!allReady && (
                <button 
                  onClick={handleRemindTravelers}
                  className="w-full mt-6 py-2.5 text-sm font-semibold text-brand-blue bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-4 h-4" /> Remind Pending Travelers
                </button>
              )}
            </div>
            
          </div>

          {/* Right Column: Itinerary & Expenses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Group Expense Logger */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-primary-dark text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-accent-gold" />
                  Group Expenses
                </h3>
                <button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-4 py-2 bg-primary-dark text-white text-sm font-semibold rounded-xl hover:bg-primary-blue transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Log Expense
                </button>
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{toDDMMYYYY(exp.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            exp.category === 'Accommodation' ? 'bg-blue-50 text-blue-700' :
                            exp.category === 'Dining' ? 'bg-green-50 text-green-700' :
                            exp.category === 'Transport' ? 'bg-purple-50 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-primary-dark">{exp.vendor}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary-dark">₹{formatToINR(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shared Itinerary Builder */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-primary-dark text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-blue" />
                  Shared Itinerary
                </h3>
                <button 
                  onClick={() => setIsEventModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>

              <div className="space-y-4 relative">
                {itinerary.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 text-right shrink-0 pt-2">
                      <p className="font-bold text-primary-dark leading-none">{item.time}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                    </div>
                    <div className="w-px bg-slate-200 relative shrink-0">
                      <div className={`absolute w-3 h-3 ${item.color} rounded-full -left-[5px] top-2 ring-4 ring-white`}></div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-1 mb-2">
                      <h4 className="font-bold text-primary-dark">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
      />
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
