'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Mail, Phone, Building, Briefcase } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employee_code: string;
  department: string | null;
  designation: string | null;
  status: 'active' | 'on_trip' | 'inactive';
}

export default function EmployeesDirectoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_trip' | 'inactive'>('all');

  useEffect(() => {
    async function loadEmployees() {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data) {
        setEmployees(data as Employee[]);
      }
      setLoading(false);
    }
    loadEmployees();
  }, [supabase]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const activeCount = employees.filter((e) => e.status === 'active').length;
  const onTripCount = employees.filter((e) => e.status === 'on_trip').length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
            EMPLOYEE DIRECTORY
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your company&apos;s team members, designations, and travel readiness.
          </p>
        </div>
        <Link
          href="/admin/employees/add"
          className="px-5 py-3 bg-gold-btn hover:bg-gold-btn-hover text-white font-bold text-sm rounded-xl shadow-btn-gold transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Link>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, code, or department..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-sky-50 text-brand-blue border border-brand-blue/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({employees.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'active'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('on_trip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'on_trip'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            On Trip ({onTripCount})
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">
          Loading employees directory...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-card border border-slate-100 text-center space-y-3">
          <div className="text-3xl">👥</div>
          <h3 className="text-base font-bold text-primary-dark">No employees found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Add your first company employee to begin planning trips.'}
          </p>
          {!search && (
            <Link
              href="/admin/employees/add"
              className="inline-block mt-2 px-4 py-2 bg-gold-btn text-white text-xs font-bold rounded-lg shadow-btn-gold"
            >
              + Add First Employee
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 space-y-4 hover:border-brand-blue/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-primary-dark text-gold-light font-bold flex items-center justify-center text-sm">
                  {getInitials(emp.full_name)}
                </div>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    emp.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : emp.status === 'on_trip'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {emp.status === 'on_trip' ? 'On Trip' : emp.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-primary-dark">{emp.full_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {emp.employee_code} · {emp.designation || 'Staff'}
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.phone || '+91 Not Provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.department || 'General'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
