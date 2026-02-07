import { enablePartnerPush } from "../../lib/push";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, clearAuthToken } from "../../lib/api";
import { useRinger } from "../../lib/ringer";

<button
  onClick={async () => {
    try {
      const t = await enablePartnerPush();
      console.log("FCM_TOKEN:", t);
      alert("✅ Alerts enabled. Token logged in console.");
    } catch (e) {
      alert(`❌ ${e.message}`);
    }
  }}
  style={{ padding: 10, borderRadius: 10, marginBottom: 12 }}
>
  Enable Alerts
</button>

const INR = (n) => (isFinite(n) ? `₹${Number(n).toLocaleString("en-IN")}` : "—");

function norm(o) {
  return {
    id: o?._id,
    status: o?.status || "placed",
    etaMins: Number(o?.etaMins ?? 0),
    total: Number(o?.total ?? 0),
    createdAt: o?.createdAt,
    contact: o?.contact || {},
    address: o?.address || {},
    items: Array.isArray(o?.items) ? o.items : [],
  };
}

export default function PartnerOrders() {
  const r = useRinger("/sounds/order.mp3");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyActive, setOnlyActive] = useState(true);

  // ✅ queue for new orders
  const [currentNewId, setCurrentNewId] = useState("");
  const queueRef = useRef([]);          // array of orderIds waiting for action
  const seenPlaced = useRef(new Set()); // to avoid duplicates
  const primed = useRef(false);

  function ringNow() {
    if (r.enabled) {
      // restart ring so it triggers every time
      try { r.stop(); } catch {}
      try { r.start(); } catch {}
    }
  }

  function enqueueNew(id) {
    if (!id) return;
    if (queueRef.current.includes(id)) return;
    queueRef.current.push(id);

    // if nothing is currently active, make this the current and ring
    if (!currentNewId) {
      setCurrentNewId(id);
      toast.success("New order received");
      ringNow();
    }
  }

  function advanceQueue() {
    // remove current from queue
    queueRef.current = queueRef.current.filter((x) => x !== currentNewId);

    const next = queueRef.current[0] || "";
    setCurrentNewId(next);

    if (next) {
      toast.success("Next new order");
      ringNow();
    } else {
      try { r.stop(); } catch {}
    }
  }

  async function fetchOrders() {
    const res = await api("/api/orders", { method: "GET" });
    const arr = (Array.isArray(res) ? res : []).map(norm);

    const placed = arr
      .filter((x) => x.status === "placed" && x.id)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); // oldest->newest

    // First load: mark existing placed as seen (NO ringing)
    if (!primed.current) {
      for (const o of placed) seenPlaced.current.add(o.id);
      primed.current = true;
    } else {
      // Next loads: enqueue ANY newly seen placed order
      for (const o of placed) {
        if (!seenPlaced.current.has(o.id)) {
          seenPlaced.current.add(o.id);
          enqueueNew(o.id);
        }
      }
    }

    setOrders(arr);
  }

  // If user enables sound after a new order exists -> ring immediately
  useEffect(() => {
    if (r.enabled && currentNewId) ringNow();
    // eslint-disable-next-line
  }, [r.enabled]);

  useEffect(() => {
    (async () => {
      try { setLoading(true); await fetchOrders(); }
      catch (e) { toast.error(e.message || "Failed to load orders"); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const t = setInterval(() => fetchOrders().catch(() => {}), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!onlyActive) return orders;
    return orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  }, [orders, onlyActive]);

  async function patch(id, body) {
    return api(`/api/orders/${id}`, { method: "PATCH", body });
  }

  async function accept() {
    if (!currentNewId) return;
    try {
      await patch(currentNewId, { status: "confirmed" });
      toast.success("Accepted");
      advanceQueue();
      await fetchOrders();
    } catch (e) {
      toast.error(e.message || "Accept failed");
    }
  }

  function mute() {
    // mute means: stop ringing + move to next pending (or clear)
    advanceQueue();
  }

  function logout() {
    clearAuthToken();
    location.href = "/partner/login";
  }

  async function testRing() {
    try {
      if (!r.enabled) await r.enableSound();
      ringNow();
      setTimeout(() => { try { r.stop(); } catch {} }, 1200);
      toast.success("Ring test played");
    } catch {
      toast.error("Ring test blocked");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>Partner Orders</h1>

          <button onClick={() => fetchOrders().catch(() => {})} style={btn("secondary")}>Refresh</button>

          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            Active only
          </label>

          <button
            onClick={r.enableSound}
            style={r.enabled ? btn("success") : btn("secondary")}
            title="Click once to allow ringtone"
          >
            {r.enabled ? "Sound Enabled ✅" : "Enable Sound 🔊"}
          </button>

          <button onClick={testRing} style={btn("secondary")}>Test Ring</button>

          <button onClick={logout} style={btn("danger")}>Logout</button>

          {loading && <span style={{ color: "#64748b" }}>Loading…</span>}
        </div>

        {currentNewId && (
          <div style={{ ...card(), marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", borderColor: "#fdba74", background: "#fff7ed" }}>
            <div>
              <div style={{ fontWeight: 800 }}>New order waiting</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>ID: {currentNewId}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>Queue: {queueRef.current.length}</div>
              {!r.enabled && <div style={{ color: "#b45309", fontSize: 13, marginTop: 4 }}>Tap “Enable Sound” to allow ringing.</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={mute} style={btn("secondary")}>Mute / Next</button>
              <button onClick={accept} style={btn("primary")}>Accept</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((o) => (
            <OrderCard key={o.id} o={o} patch={patch} onRefresh={fetchOrders} />
          ))}
          {!filtered.length && <div style={{ color: "#64748b" }}>No orders.</div>}
        </div>
      </div>
    </main>
  );
}

function OrderCard({ o, patch, onRefresh }) {
  const when = o.createdAt ? new Date(o.createdAt).toLocaleString() : "—";
  const address = [o.address?.line1, o.address?.line2, [o.address?.city, o.address?.pincode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  async function setStatus(status) {
    try {
      await patch(o.id, { status });
      toast.success(`Status → ${status}`);
      await onRefresh();
    } catch (e) {
      toast.error(e.message || "Status update failed");
    }
  }

  async function setEtaMinutes() {
    const val = prompt("Set ETA (minutes):", String(o.etaMins || 30));
    if (val == null) return;
    const num = Number(val);
    if (!isFinite(num) || num < 0) return toast.error("Enter a valid number");
    try {
      await patch(o.id, { etaMins: num });
      toast.success("ETA updated");
      await onRefresh();
    } catch (e) {
      toast.error(e.message || "ETA update failed");
    }
  }

  return (
    <section style={card()}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontFamily: "ui-monospace,monospace" }}>
          <b>Order ID</b> {o.id || "—"}
        </div>
        <span style={badge()}>{o.status}</span>
        <span style={muted()}>When: {when}</span>
        <span style={{ ...muted(), fontWeight: 600 }}>ETA: {o.etaMins ? `${o.etaMins} mins` : "—"}</span>
        <span><b>Total:</b> {INR(o.total)}</span>
      </header>

      <div style={grid()}>
        <div><b>Customer</b><div>{o.contact?.name || "—"}</div></div>
        <div><b>Phone</b><div>{o.contact?.phone ? <a href={`tel:${o.contact.phone}`}>{o.contact.phone}</a> : "—"}</div></div>
        <div style={{ gridColumn: "1 / -1" }}><b>Address</b><div>{address || "—"}</div></div>
      </div>

      <div style={{ marginTop: 8 }}>
        <b>Items</b>
        <ul style={{ margin: "6px 0 0 16px" }}>
          {o.items.map((it, i) => (
            <li key={i} style={{ lineHeight: 1.4 }}>
              {it?.name || "Item"} — {INR(it?.price)}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button style={btn("primary")} onClick={() => setStatus("preparing")}>Preparing</button>
        <button style={btn("primary")} onClick={() => setStatus("ready")}>Ready</button>
        <button style={btn("primary")} onClick={() => setStatus("out_for_delivery")}>Out for Delivery</button>
        <button style={btn("success")} onClick={() => setStatus("completed")}>Completed</button>
        <button style={btn("danger")} onClick={() => setStatus("cancelled")}>Cancel</button>
        <button style={btn("secondary")} onClick={setEtaMinutes}>Set ETA</button>
        <a href={`https://uva-uve-foods-frontend.onrender.com/track/${o.id}`} target="_blank" rel="noreferrer" style={btnLink()}>Track</a>
      </div>
    </section>
  );
}

/* styles */
function card() { return { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }; }
function grid() { return { display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0,1fr))" }; }
function muted() { return { color: "#64748b" }; }
function badge() { return { padding: "2px 8px", background: "#eef2ff", color: "#4338ca", borderRadius: 999, fontSize: 12 }; }
function btn(variant) {
  const base = { padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#0f172a", color: "#fff", cursor: "pointer" };
  if (variant === "secondary") return { ...base, background: "#f8fafc", color: "#0f172a" };
  if (variant === "success") return { ...base, background: "#16a34a" };
  if (variant === "danger") return { ...base, background: "#dc2626" };
  return base;
}
function btnLink() { return { display: "inline-block", padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f8fafc", color: "#0f172a", textDecoration: "none" }; }
