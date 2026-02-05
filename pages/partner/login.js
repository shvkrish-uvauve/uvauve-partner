import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { api, setAuthToken } from "../../lib/api";

export default function PartnerLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const { identifier, password } = form;

    if (!identifier.trim()) return toast.error("Enter email or phone");
    if (password.length < 6) return toast.error("Invalid password");

    setLoading(true);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { identifier: identifier.trim(), password },
      });

      if (res?.token) setAuthToken(res.token);

      toast.success("Partner login successful");
      router.replace("/partner/orders");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap()}>
      <div style={card()}>
        <h1 style={{ margin: 0 }}>Partner Login</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Restaurant / Partner access
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={label()}>Email or Phone</label>
            <input
              name="identifier"
              value={form.identifier}
              onChange={onChange}
              placeholder="email or phone"
              style={input()}
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label()}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              style={input()}
              required
              minLength={6}
            />
          </div>

          <button disabled={loading} style={btn()}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---- styles ---- */
function wrap() {
  return {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f8fafc",
    padding: 16,
  };
}
function card() {
  return {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  };
}
function label() {
  return { fontSize: 13, color: "#334155" };
}
function input() {
  return {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
  };
}
function btn() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
  };
}
