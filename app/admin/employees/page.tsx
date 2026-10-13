'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Mail, Phone, Building, Briefcase, Trash2, Loader2 } from 'lucide-react';
import { deleteEmployeeAction } from '@/app/admin/employees/actions';

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
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    setActionError('');

    const result = await deleteEmployeeAction(employeeToDelete.id);
    if (!result.success) {
      setActionError(result.error || 'Failed to delete employee.');
      setDeleting(false);
      return;
    }

    setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
    setDeleting(false);
    setEmployeeToDelete(null);
    setActionSuccess('Employee permanently deleted from authentication and company records.');
    setTimeout(() => setActionSuccess(''), 4000);
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

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

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
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => {
                      setActionError('');
                      setEmployeeToDelete(emp);
                    }}
                    title="Delete Employee"
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 flex items-center justify-center transition border border-red-100 shadow-sm group"
                  >
                    <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                </div>
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

      {/* Confirmation Popup Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-primary-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-dark">Delete Employee Permanently?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to delete{' '}
                  <strong className="text-primary-dark">{employeeToDelete.full_name}</strong> (
                  <span className="font-mono">{employeeToDelete.employee_code}</span>)?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-50/80 border border-red-100 space-y-1.5 text-xs text-red-800">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Permanent Deletion Impact:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Permanently deletes employee user credentials from authentication</li>
                <li>Removes employee record from company travel directory</li>
                <li>Unassigns from all scheduled trips and removes documents</li>
              </ul>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setEmployeeToDelete(null);
                  setActionError('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
