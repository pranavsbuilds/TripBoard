import React, { useState, useEffect, useMemo } from "react";
import {
  Plane, Building2, Car, Receipt, Plus, Trash2, MapPin, Calendar,
  AlertTriangle, ChevronDown, ChevronUp, Users, Wallet, TrendingUp,
  CheckCircle2, X, Loader2, UserPlus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

const INK = "#1B2430";
const INK_2 = "#232E3D";
const PAPER = "#EAEDE6";
const PAPER_2 = "#F4F6F0";
const AMBER = "#E3A23A";
const FOREST = "#3F6D4E";
const BRICK = "#B5462F";
const SLATE = "#5B6472";
const LINE = "#D9DCD1";

const STATUS_META = {
  planned: { label: "PLANNED", color: SLATE },
  approved: { label: "APPROVED", color: FOREST },
  "in-progress": { label: "IN TRANSIT", color: AMBER },
  completed: { label: "COMPLETE", color: INK },
  cancelled: { label: "CANCELLED", color: BRICK },
};

const BOOKING_TYPES = [
  { key: "flight", label: "Flight", icon: Plane },
  { key: "hotel", label: "Hotel", icon: Building2 },
  { key: "road", label: "Road transport", icon: Car },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n) =>
  (Number(n) || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function travelerNames(trip) {
  const list = trip.travelers || [];
  if (list.length === 0) return "Unnamed traveler";
  return list.map((p) => p.name).filter(Boolean).join(", ") || "Unnamed traveler";
}

function tripSpend(trip) {
  const bookingTotal = (trip.bookings || []).reduce((s, b) => s + (Number(b.cost) || 0), 0);
  const invoiceTotal = (trip.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  return { bookingTotal, invoiceTotal, total: bookingTotal + invoiceTotal };
}

// ---------- Storage ----------
async function loadTrips() {
  try {
    const res = await window.storage.get("trips-all", true);
    if (res && res.value) return JSON.parse(res.value);
    return [];
  } catch (e) {
    return [];
  }
}
async function persistTrips(trips) {
  try {
    await window.storage.set("trips-all", JSON.stringify(trips), true);
  } catch (e) {
    console.error("Storage error", e);
  }
}

// ---------- Small UI atoms ----------
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        fontWeight: 600,
        color: "#fff",
        background: meta.color,
        padding: "3px 8px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function FlipStat({ label, value, sub }) {
  return (
    <div
      style={{
        background: INK,
        borderRadius: 6,
        padding: "14px 16px",
        flex: "1 1 140px",
        minWidth: 140,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 24,
          fontWeight: 600,
          color: AMBER,
          letterSpacing: "0.02em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 11,
          color: "#AEB6C2",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 4,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#7C8595", marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = spent > budget && budget > 0;
  return (
    <div>
      <div style={{ height: 8, background: LINE, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: over ? BRICK : FOREST,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11.5,
          marginTop: 5,
          color: over ? BRICK : "#4A5260",
        }}
      >
        <span>{money(spent)} spent</span>
        <span>{budget > 0 ? `${money(budget)} budget` : "no budget set"}</span>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 11.5,
          fontWeight: 600,
          color: SLATE,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 10px",
  border: `1px solid ${LINE}`,
  borderRadius: 5,
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: 14,
  color: INK,
  background: "#fff",
  outline: "none",
};

function Button({ children, onClick, variant = "primary", type = "button", small, disabled }) {
  const base = {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
    fontSize: small ? 12.5 : 13.5,
    padding: small ? "7px 12px" : "9px 16px",
    borderRadius: 5,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: INK, color: "#fff" },
    accent: { background: AMBER, color: INK },
    ghost: { background: "transparent", color: SLATE, boxShadow: `inset 0 0 0 1px ${LINE}` },
    danger: { background: "transparent", color: BRICK, boxShadow: `inset 0 0 0 1px ${BRICK}55` },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ---------- Booking / Invoice forms ----------
function BookingForm({ onAdd, onCancel }) {
  const [type, setType] = useState("flight");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!vendor || !cost) return;
    onAdd({ id: uid(), type, vendor, cost: Number(cost), date, notes });
  };

  return (
    <div style={{ background: PAPER_2, border: `1px dashed ${LINE}`, borderRadius: 6, padding: 12, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {BOOKING_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            style={{
              flex: 1,
              padding: "7px 4px",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              background: type === t.key ? INK : "#fff",
              color: type === t.key ? "#fff" : SLATE,
              boxShadow: type === t.key ? "none" : `inset 0 0 0 1px ${LINE}`,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Vendor / carrier">
          <input style={inputStyle} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Delta, Marriott" />
        </Field>
        <Field label="Cost (USD)">
          <input style={inputStyle} type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Date">
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Notes">
          <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Button variant="accent" onClick={submit} small><Plus size={13} /> Add booking</Button>
        <Button variant="ghost" onClick={onCancel} small>Cancel</Button>
      </div>
    </div>
  );
}

function InvoiceForm({ onAdd, onCancel }) {
  const [category, setCategory] = useState("meals");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!amount) return;
    onAdd({ id: uid(), category, amount: Number(amount), date, vendor, notes });
  };

  return (
    <div style={{ background: PAPER_2, border: `1px dashed ${LINE}`, borderRadius: 6, padding: 12, marginTop: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Category">
          <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="meals">Meals</option>
            <option value="hotel">Hotel (extra)</option>
            <option value="transport">Local transport</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </Field>
        <Field label="Amount (USD)">
          <input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Date">
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Vendor">
          <input style={inputStyle} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <Field label="Notes">
        <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Button variant="accent" onClick={submit} small><Plus size={13} /> Log invoice</Button>
        <Button variant="ghost" onClick={onCancel} small>Cancel</Button>
      </div>
    </div>
  );
}

// ---------- Trip card ----------
function TripCard({ trip, expanded, onToggle, onUpdate, onDelete }) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const { total } = tripSpend(trip);
  const over = trip.budget > 0 && total > trip.budget;

  const addBooking = (b) => {
    onUpdate({ ...trip, bookings: [...(trip.bookings || []), b] });
    setShowBookingForm(false);
  };
  const addInvoice = (i) => {
    onUpdate({ ...trip, invoices: [...(trip.invoices || []), i] });
    setShowInvoiceForm(false);
  };
  const removeBooking = (id) => onUpdate({ ...trip, bookings: trip.bookings.filter((b) => b.id !== id) });
  const removeInvoice = (id) => onUpdate({ ...trip, invoices: trip.invoices.filter((i) => i.id !== id) });
  const setStatus = (status) => onUpdate({ ...trip, status });

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        boxShadow: `0 1px 2px rgba(27,36,48,0.06), inset 0 0 0 1px ${LINE}`,
        marginBottom: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* perforation edge */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `repeating-linear-gradient(${PAPER}, ${PAPER} 5px, transparent 5px, transparent 10px)` }} />
      <div style={{ padding: "14px 16px 14px 20px", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 600, color: INK, letterSpacing: "0.01em" }}>
              {(trip.travelers || []).length > 1 && <Users size={16} color={SLATE} />}
              {travelerNames(trip)}
            </div>
            {(trip.travelers || []).length > 1 && (
              <div style={{ fontSize: 11, color: "#9AA1AC", fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>
                {trip.travelers.length} travelers{trip.travelers.some((p) => p.department) ? ` · ${[...new Set(trip.travelers.map((p) => p.department).filter(Boolean))].join(", ")}` : ""}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, color: SLATE, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <MapPin size={13} /> {trip.destination || "—"}
              <span style={{ color: LINE }}>•</span>
              <Calendar size={13} /> {trip.startDate || "?"} → {trip.endDate || "?"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={trip.status} />
            {expanded ? <ChevronUp size={18} color={SLATE} /> : <ChevronDown size={18} color={SLATE} />}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar spent={total} budget={Number(trip.budget) || 0} />
        </div>
        {over && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, color: BRICK, fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
            <AlertTriangle size={13} /> Over budget by {money(total - trip.budget)}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${LINE}`, padding: "14px 16px 16px 20px", background: PAPER_2 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
              Travelers
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(trip.travelers || []).map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`,
                    borderRadius: 4, padding: "4px 9px", fontSize: 12.5,
                    fontFamily: "'IBM Plex Sans', sans-serif", color: INK,
                  }}
                >
                  {p.name}{p.department ? <span style={{ color: "#9AA1AC" }}> · {p.department}</span> : null}
                </span>
              ))}
            </div>
          </div>

          {trip.purpose && (
            <div style={{ fontSize: 13, color: SLATE, marginBottom: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <strong style={{ color: INK }}>Purpose: </strong>{trip.purpose}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {Object.keys(STATUS_META).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  padding: "4px 9px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  background: trip.status === s ? STATUS_META[s].color : "#fff",
                  color: trip.status === s ? "#fff" : SLATE,
                  boxShadow: trip.status === s ? "none" : `inset 0 0 0 1px ${LINE}`,
                }}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          {/* Bookings */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Bookings
              </div>
              {!showBookingForm && (
                <Button variant="ghost" small onClick={() => setShowBookingForm(true)}><Plus size={12} /> Add</Button>
              )}
            </div>
            {(trip.bookings || []).length === 0 && !showBookingForm && (
              <div style={{ fontSize: 12.5, color: "#9AA1AC", fontFamily: "'IBM Plex Sans', sans-serif" }}>No bookings logged yet.</div>
            )}
            {(trip.bookings || []).map((b) => {
              const Icon = (BOOKING_TYPES.find((t) => t.key === b.type) || {}).icon || Plane;
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${LINE}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", color: INK }}>
                    <Icon size={14} color={SLATE} />
                    <span style={{ fontWeight: 600 }}>{b.vendor}</span>
                    {b.date && <span style={{ color: "#9AA1AC", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}>{b.date}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: INK }}>{money(b.cost)}</span>
                    <button onClick={() => removeBooking(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C2C7CE" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
            {showBookingForm && <BookingForm onAdd={addBooking} onCancel={() => setShowBookingForm(false)} />}
          </div>

          {/* Invoices */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Invoices &amp; expenses
              </div>
              {!showInvoiceForm && (
                <Button variant="ghost" small onClick={() => setShowInvoiceForm(true)}><Plus size={12} /> Add</Button>
              )}
            </div>
            {(trip.invoices || []).length === 0 && !showInvoiceForm && (
              <div style={{ fontSize: 12.5, color: "#9AA1AC", fontFamily: "'IBM Plex Sans', sans-serif" }}>No invoices logged yet.</div>
            )}
            {(trip.invoices || []).map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${LINE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", color: INK }}>
                  <Receipt size={14} color={SLATE} />
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{i.category}</span>
                  {i.vendor && <span style={{ color: "#9AA1AC" }}>· {i.vendor}</span>}
                  {i.date && <span style={{ color: "#9AA1AC", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}>{i.date}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: INK }}>{money(i.amount)}</span>
                  <button onClick={() => removeInvoice(i.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C2C7CE" }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {showInvoiceForm && <InvoiceForm onAdd={addInvoice} onCancel={() => setShowInvoiceForm(false)} />}
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="danger" small onClick={() => onDelete(trip.id)}><Trash2 size={13} /> Delete trip</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- New trip form ----------
function NewTripForm({ onCreate }) {
  const [travelers, setTravelers] = useState([{ id: uid(), name: "", department: "" }]);
  const [form, setForm] = useState({
    destination: "", purpose: "", startDate: "", endDate: "", budget: "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const setTraveler = (id, key, value) =>
    setTravelers(travelers.map((t) => (t.id === id ? { ...t, [key]: value } : t)));
  const addTraveler = () => setTravelers([...travelers, { id: uid(), name: "", department: "" }]);
  const removeTraveler = (id) => setTravelers(travelers.length > 1 ? travelers.filter((t) => t.id !== id) : travelers);

  const submit = () => {
    const cleanTravelers = travelers.filter((t) => t.name.trim());
    if (cleanTravelers.length === 0 || !form.destination) return;
    onCreate({
      id: uid(),
      travelers: cleanTravelers.map((t) => ({ name: t.name.trim(), department: t.department.trim() })),
      ...form,
      budget: Number(form.budget) || 0,
      status: "planned",
      bookings: [],
      invoices: [],
      createdAt: new Date().toISOString(),
    });
    setTravelers([{ id: uid(), name: "", department: "" }]);
    setForm({ destination: "", purpose: "", startDate: "", endDate: "", budget: "" });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: `inset 0 0 0 1px ${LINE}`, padding: 20, maxWidth: 560 }}>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600, color: INK, marginBottom: 4 }}>
        New trip request
      </div>
      <div style={{ fontSize: 12.5, color: SLATE, marginBottom: 14, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Add everyone traveling together — one budget and itinerary covers the whole group.
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK,
          textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8,
        }}
      >
        Travelers
      </div>
      {travelers.map((t, idx) => (
        <div key={t.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input
            style={{ ...inputStyle, flex: 1.2 }}
            value={t.name}
            onChange={(e) => setTraveler(t.id, "name", e.target.value)}
            placeholder={`Traveler ${idx + 1} name`}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={t.department}
            onChange={(e) => setTraveler(t.id, "department", e.target.value)}
            placeholder="Department"
          />
          {travelers.length > 1 && (
            <button
              onClick={() => removeTraveler(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#C2C7CE", flexShrink: 0 }}
              aria-label="Remove traveler"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      <div style={{ marginBottom: 16 }}>
        <Button variant="ghost" small onClick={addTraveler}><UserPlus size={13} /> Add another traveler</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Destination"><input style={inputStyle} value={form.destination} onChange={set("destination")} placeholder="Chicago, IL" /></Field>
        <Field label="Budget — total for group (USD)"><input style={inputStyle} type="number" value={form.budget} onChange={set("budget")} placeholder="2000" /></Field>
        <Field label="Start date"><input style={inputStyle} type="date" value={form.startDate} onChange={set("startDate")} /></Field>
        <Field label="End date"><input style={inputStyle} type="date" value={form.endDate} onChange={set("endDate")} /></Field>
      </div>
      <Field label="Purpose of trip"><input style={inputStyle} value={form.purpose} onChange={set("purpose")} placeholder="Client renewal meeting" /></Field>
      <Button variant="accent" onClick={submit}><Plus size={14} /> Create trip</Button>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ trips }) {
  const stats = useMemo(() => {
    const totalBudget = trips.reduce((s, t) => s + (Number(t.budget) || 0), 0);
    const totalSpent = trips.reduce((s, t) => s + tripSpend(t).total, 0);
    const overBudget = trips.filter((t) => t.budget > 0 && tripSpend(t).total > t.budget);
    return { totalBudget, totalSpent, overBudget };
  }, [trips]);

  const chartData = trips.map((t) => {
    const people = t.travelers || [];
    const label = people.length > 1
      ? `${(people[0].name || "Trip").split(" ")[0]} +${people.length - 1}`
      : (people[0]?.name || "Trip").split(" ")[0].slice(0, 10);
    return { name: label, budget: Number(t.budget) || 0, spent: tripSpend(t).total };
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <FlipStat label="Active trips" value={trips.length} />
        <FlipStat label="Total budget" value={money(stats.totalBudget)} />
        <FlipStat label="Total spent" value={money(stats.totalSpent)} sub={stats.totalBudget > 0 ? `${Math.round((stats.totalSpent / stats.totalBudget) * 100)}% of budget` : ""} />
        <FlipStat label="Over budget" value={stats.overBudget.length} />
      </div>

      {trips.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: `inset 0 0 0 1px ${LINE}`, padding: "16px 8px 8px", marginBottom: 22 }}>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: INK, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 8px 10px" }}>
            Budget vs. spend by trip
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "IBM Plex Sans" }} stroke={SLATE} />
              <YAxis tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} stroke={SLATE} width={50} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ fontFamily: "IBM Plex Sans", fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="budget" fill={LINE} radius={[3, 3, 0, 0]} name="Budget" />
              <Bar dataKey="spent" radius={[3, 3, 0, 0]} name="Spent">
                {chartData.map((d, idx) => (
                  <Cell key={idx} fill={d.spent > d.budget && d.budget > 0 ? BRICK : FOREST} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.overBudget.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: `inset 0 0 0 1px ${BRICK}55`, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: BRICK, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 12.5, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <AlertTriangle size={14} /> Needs attention
          </div>
          {stats.overBudget.map((t) => (
            <div key={t.id} style={{ fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", color: INK, padding: "4px 0" }}>
              <strong>{travelerNames(t)}</strong> — {t.destination}: {money(tripSpend(t).total - t.budget)} over
            </div>
          ))}
        </div>
      )}

      {trips.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: SLATE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          No trips yet. Create one from the "New trip" tab to get started.
        </div>
      )}
    </div>
  );
}

// ---------- App ----------
export default function TripboardApp() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      const t = await loadTrips();
      setTrips(t);
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setTrips(next);
    await persistTrips(next);
  };

  const createTrip = async (trip) => {
    const next = [trip, ...trips];
    await persist(next);
    setTab("trips");
    setExpandedId(trip.id);
  };
  const updateTrip = async (updated) => {
    const next = trips.map((t) => (t.id === updated.id ? updated : t));
    await persist(next);
  };
  const deleteTrip = async (id) => {
    const next = trips.filter((t) => t.id !== id);
    await persist(next);
  };

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "trips", label: "Trips", icon: Users },
    { key: "new", label: "New trip", icon: Plus },
  ];

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{FONTS}</style>

      <div style={{ background: INK, padding: "18px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plane size={18} color={INK} />
          </div>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>
              TRIPBOARD
            </div>
            <div style={{ fontSize: 11, color: "#8A93A3", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
              CORPORATE TRAVEL OPS
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", border: "none", cursor: "pointer",
                background: tab === t.key ? PAPER : "transparent",
                color: tab === t.key ? INK : "#AEB6C2",
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
                borderRadius: "6px 6px 0 0", whiteSpace: "nowrap",
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 18, maxWidth: 900, margin: "0 auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: SLATE, padding: 40, justifyContent: "center" }}>
            <Loader2 size={16} className="animate-spin" /> Loading trips…
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard trips={trips} />}
            {tab === "trips" && (
              <div>
                {trips.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: SLATE }}>
                    No trips yet. <button onClick={() => setTab("new")} style={{ color: FOREST, background: "none", border: "none", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>Create the first one</button>.
                  </div>
                )}
                {trips.map((t) => (
                  <TripCard
                    key={t.id}
                    trip={t}
                    expanded={expandedId === t.id}
                    onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    onUpdate={updateTrip}
                    onDelete={deleteTrip}
                  />
                ))}
              </div>
            )}
            {tab === "new" && <NewTripForm onCreate={createTrip} />}
          </>
        )}
      </div>
    </div>
  );
}
