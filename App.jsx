import { useState, useEffect } from "react";

const SU = "https://xxtawpxcnkuiiwbgnwka.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dGF3cHhjbmt1aWl3Ymdud2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTc5MDYsImV4cCI6MjA4OTQ5MzkwNn0.zoGX24vnYIw5cbExS7O0m7--1s8pGw7va-J4yXANxHc";
const hdr = (t) => ({ apikey: SK, Authorization: `Bearer ${t || SK}`, "Content-Type": "application/json" });
const api = {
  signUp: async (e, p, m) => (await fetch(`${SU}/auth/v1/signup`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SK }, body: JSON.stringify({ email: e, password: p, data: m }) })).json(),
  signIn: async (e, p) => (await fetch(`${SU}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SK }, body: JSON.stringify({ email: e, password: p }) })).json(),
  get: async (t, tk, q = "") => (await fetch(`${SU}/rest/v1/${t}?${q}`, { headers: hdr(tk) })).json(),
  post: async (t, d, tk) => (await fetch(`${SU}/rest/v1/${t}`, { method: "POST", headers: { ...hdr(tk), Prefer: "return=representation" }, body: JSON.stringify(d) })).json(),
  patch: async (t, m, d, tk) => (await fetch(`${SU}/rest/v1/${t}?${m}`, { method: "PATCH", headers: hdr(tk), body: JSON.stringify(d) })).json(),
};

const C = { bg: "#F4F1F8", card: "#FFF", coral: "#E85D4A", navy: "#1B2B5A", text: "#1A1A2E", tl: "#6B6B80", tlr: "#9494A8", teal: "#2AA6A6", green: "#4CAF50", purple: "#7B6B8A", wg: "#A89B8C", bdr: "#E8E4F0", lb: "#7BA7CC", cbg: "rgba(232,93,74,0.08)" };

const TM = {
  run_easy: { i: "🏃", l: "Easy Run", c: C.lb }, run_tempo: { i: "🏃", l: "Tempo", c: C.navy },
  run_intervals: { i: "🏃", l: "Intervals", c: C.navy }, run_long: { i: "🏃", l: "Long Run", c: C.purple },
  swim: { i: "🏊", l: "Swim", c: C.teal }, bike: { i: "🚴", l: "Bike", c: C.green },
  strength: { i: "💪", l: "S&C", c: C.coral }, mobility: { i: "🧘", l: "Mobility", c: C.wg },
  rest: { i: "😴", l: "Rest", c: "#D4D0DC" }
};

const PHASES = { "Base": { color: C.green }, "Build": { color: C.teal }, "Recovery": { color: C.lb }, "Peak": { color: C.coral }, "Taper": { color: C.purple }, "Race": { color: "#D4A84B" } };
const DN = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMO = ["", "😫", "😤", "😊", "😎", "🔥"];
const EML = ["", "Hard", "Tough", "Good", "Great", "Crushed it"];
const COACH_ID = "584fc808-7280-48f6-aba5-39d9d5404bab";

// ===== SMART PLAN UTILITIES =====
const fmtPace = (sec) => {
  if (!sec || isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
};

const getRaceDistance = (planName) => {
  if (!planName) return null;
  const n = planName.toLowerCase();
  if (n.includes("10k")) return 10;
  if (n.includes("21k") || n.includes("half marathon")) return 21.1;
  if (n.includes("42k") || n.includes("marathon master") || n.includes("marathon")) return 42.2;
  if (n.includes("5k")) return 5;
  return null;
};

const calcPaces = (racePaceSec) => {
  if (!racePaceSec) return null;
  return {
    easy: racePaceSec + 90,
    tempo: racePaceSec + 25,
    steady: racePaceSec + 45,
    interval: racePaceSec - 15,
    long: racePaceSec + 75,
    race: racePaceSec,
  };
};

const calcHRZones = (age) => {
  if (!age) return null;
  const mhr = 220 - parseInt(age);
  return {
    mhr,
    zone1: [Math.round(mhr * 0.50), Math.round(mhr * 0.60)],
    zone2: [Math.round(mhr * 0.60), Math.round(mhr * 0.70)],
    zone3: [Math.round(mhr * 0.70), Math.round(mhr * 0.80)],
    zone4: [Math.round(mhr * 0.80), Math.round(mhr * 0.90)],
    zone5: [Math.round(mhr * 0.90), mhr],
  };
};

const WORKOUT_PACE_KEY = {
  run_easy: "easy",
  run_tempo: "tempo",
  run_intervals: "interval",
  run_long: "long",
};

const parseZone = (zone) => {
  if (!zone) return null;
  const z = zone.toLowerCase();
  if (z.includes("1-2")) return 2;
  if (z.includes("3-4")) return 3;
  if (z.includes("1")) return 1;
  if (z.includes("2")) return 2;
  if (z.includes("3")) return 3;
  if (z.includes("4")) return 4;
  if (z.includes("5")) return 5;
  return null;
};

const EXPERIENCE_MULTIPLIER = {
  beginner: 1.2,
  intermediate: 1.0,
  advanced: 0.85,
  expert: 0.85,
};

// ===== UI COMPONENTS =====
const Btn = ({ dis, onClick, children, sec }) => (
  <button disabled={dis} onClick={onClick} style={{
    background: sec ? "none" : dis ? C.bdr : C.coral, color: sec ? C.tl : dis ? C.tlr : "#fff",
    border: sec ? `2px solid ${C.bdr}` : "none", padding: "15px 28px", borderRadius: 50,
    fontWeight: 700, fontSize: 15, cursor: dis ? "not-allowed" : "pointer", width: "100%",
    boxShadow: dis || sec ? "none" : "0 4px 20px rgba(232,93,74,0.3)", fontFamily: "inherit",
  }}>{children}</button>
);

const Crd = ({ sel, onClick, icon, label, desc }) => (
  <div onClick={onClick} style={{
    background: sel ? C.cbg : C.card, border: `2px solid ${sel ? C.coral : C.bdr}`,
    borderRadius: 14, padding: "15px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
  }}>
    {icon && <span style={{ fontSize: 22, width: 34, textAlign: "center" }}>{icon}</span>}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>{desc}</div>}
    </div>
    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? C.coral : C.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {sel && <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.coral }} />}
    </div>
  </div>
);

const Pill = ({ sel, onClick, children }) => (
  <div onClick={onClick} style={{
    padding: "10px 20px", borderRadius: 50, border: `2px solid ${sel ? C.coral : C.bdr}`,
    background: sel ? C.cbg : C.card, color: sel ? C.coral : C.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
  }}>{children}</div>
);

const Bar = ({ s, t }) => (
  <div style={{ display: "flex", gap: 5, padding: "16px 24px 0" }}>
    {Array.from({ length: t }, (_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < s ? C.coral : C.bdr }} />)}
  </div>
);

const Bk = ({ onClick }) => <button onClick={onClick} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer", padding: "12px 24px 0", alignSelf: "flex-start" }}>←</button>;
const Sc = ({ children }) => <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "0 24px", background: C.bg }}>{children}</div>;
const H1 = ({ children }) => <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, lineHeight: 1.15, marginBottom: 6, marginTop: 20 }}>{children}</h1>;
const Sb = ({ children }) => <p style={{ fontSize: 14, color: C.tl, lineHeight: 1.6, marginBottom: 24 }}>{children}</p>;
const Lb = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 6 }}>{children}</div>;
const Inp = ({ label, type, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" }}>{label}</label>
    <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 14, color: C.text, background: C.card, outline: "none", boxSizing: "border-box" }} />
  </div>
);
const Nav = ({ tab, setTab }) => (
  <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `1px solid ${C.bdr}`, display: "flex", padding: "8px 0 24px", zIndex: 10 }}>
    {[{ i: "📅", l: "Today", id: "today" }, { i: "📋", l: "Plan", id: "plan" }, { i: "📊", l: "Progress", id: "progress" }, { i: "👤", l: "Profile", id: "profile" }].map(t => (
      <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
        <span style={{ fontSize: 18 }}>{t.i}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? C.coral : C.tlr }}>{t.l}</span>
      </div>
    ))}
  </div>
);

// ===== ONBOARDING =====
function Onboarding({ onComplete }) {
  const [s, setS] = useState("welcome");
  const [sport, setSport] = useState("");
  const [goal, setGoal] = useState("");
  const [evN, setEvN] = useState("");
  const [evD, setEvD] = useState("");
  const [evDt, setEvDt] = useState("");
  const [goalH, setGoalH] = useState("");
  const [goalM, setGoalM] = useState("");
  const [exp, setExp] = useState("");
  const [gen, setGen] = useState("");
  const [age, setAge] = useState("");
  const [sess, setSess] = useState(null);
  const [str, setStr] = useState(null);
  const [mob, setMob] = useState(null);
  const [days, setDays] = useState([]);
  const [style, setStyle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [prog, setProg] = useState(0);
  const [tip, setTip] = useState(0);

  const td = d => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const tips = ["Every workout has a purpose", "Consistency beats intensity", "Strength and mobility are non-negotiable", "Trust the process"];

  useEffect(() => {
    if (s === "building") {
      const i = setInterval(() => setProg(p => { if (p >= 100) { clearInterval(i); setTimeout(() => setS("summary"), 400); return 100; } return p + 3; }), 45);
      const t = setInterval(() => setTip(v => (v + 1) % tips.length), 2000);
      return () => { clearInterval(i); clearInterval(t); };
    }
  }, [s]);

  const doSignUp = async () => {
    setLd(true); setErr("");
    try {
      const r = await api.signUp(email, pw, { full_name: name, role: "athlete" });
      if (r.error) { setErr(r.error.message); setLd(false); return; }
      const si = await api.signIn(email, pw);
      if (si.error) { setErr("Account created! Try logging in."); setLd(false); return; }
      try { 
        const goalSeconds = (parseInt(goalH || 0) * 3600) + (parseInt(goalM || 0) * 60);
        await api.post("athlete_profiles", { 
          user_id: si.user.id, 
          sport_type: sport, 
          experience_level: exp, 
          gender: gen, 
          age: age ? parseInt(age) : null,
          sessions_per_week: sess || 4, 
          available_days: days, 
          strength_per_week: str || 1, 
          mobility_per_week: mob || 1, 
          coaching_style: style, 
          coach_id: COACH_ID,
          goal_time_seconds: goalSeconds > 0 ? goalSeconds : null,
          race_distance: evD || null,
          event_name: evN || null,
          event_date: evDt || null,
        }, si.access_token); 
      } catch (e) { }
      onComplete({ user: si.user, token: si.access_token, name, role: "athlete" });
    } catch (e) { setErr("Connection error."); setLd(false); }
  };

  const doLogin = async () => {
    setLd(true); setErr("");
    try {
      const r = await api.signIn(email, pw);
      if (r.error) { setErr(r.error.message); setLd(false); return; }
      const p = await api.get("profiles", r.access_token, `id=eq.${r.user.id}`);
      onComplete({ user: r.user, token: r.access_token, name: p?.[0]?.full_name || "", role: p?.[0]?.role || "athlete" });
    } catch (e) { setErr("Connection error."); setLd(false); }
  };

  if (s === "welcome") return (
    <Sc>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.navy }}>K<span style={{ color: C.coral }}>.</span></div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.navy, marginTop: -4 }}>Kinetic</div>
        <div style={{ fontSize: 15, color: C.tl, marginTop: 14, lineHeight: 1.6 }}>Structured training. Real coaching.<br />Purpose behind every session.</div>
        <div style={{ marginTop: 48, width: "100%", maxWidth: 320 }}>
          <Btn onClick={() => setS("s1")}>Get Started</Btn>
          <div style={{ height: 14 }} />
          <Btn sec onClick={() => setS("login")}>I already have an account</Btn>
        </div>
      </div>
    </Sc>
  );

  if (s === "login") return (
    <Sc>
      <Bk onClick={() => setS("welcome")} />
      <H1>Welcome back</H1>
      <Sb>Log in to continue training.</Sb>
      <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <Inp label="Password" type="password" value={pw} onChange={setPw} placeholder="Your password" />
      <div onClick={() => setS("forgot")} style={{ fontSize: 13, color: C.coral, fontWeight: 600, cursor: "pointer", marginTop: -6, marginBottom: 14, textAlign: "right" }}>Forgot password?</div>
      {err && <div style={{ color: C.coral, fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ marginTop: "auto", marginBottom: 40 }}>
        <Btn dis={ld || !email || !pw} onClick={doLogin}>{ld ? "Logging in..." : "Log In"}</Btn>
      </div>
    </Sc>
  );

  if (s === "forgot") return (
    <Sc>
      <Bk onClick={() => setS("login")} />
      <H1>Reset password</H1>
      <Sb>We'll email you a link to reset your password.</Sb>
      <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      {err && <div style={{ color: err.includes("sent") ? C.green : C.coral, fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ marginTop: "auto", marginBottom: 40 }}>
        <Btn dis={ld || !email} onClick={async () => {
          setLd(true); setErr("");
          try {
            const r = await fetch(`${SU}/auth/v1/recover`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SK },
              body: JSON.stringify({ email })
            });
            if (r.ok) { setErr("Reset link sent! Check your email."); }
            else { setErr("Could not send reset email. Check the address and try again."); }
          } catch (e) { setErr("Connection error."); }
          setLd(false);
        }}>{ld ? "Sending..." : "Send Reset Link"}</Btn>
      </div>
    </Sc>
  );

  if (s === "s1") return (
    <Sc>
      <Bar s={1} t={7} />
      <H1>What are you training for?</H1>
      <Sb>This helps us build the right plan.</Sb>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <Crd sel={sport === "running"} onClick={() => setSport("running")} icon="🏃" label="Running" desc="5K to marathon" />
        <Crd sel={sport === "triathlon"} onClick={() => setSport("triathlon")} icon="🏊‍♂️" label="Triathlon" desc="Swim, bike, run" />
        <Crd sel={sport === "general"} onClick={() => setSport("general")} icon="💪" label="General Fitness" desc="Strength, mobility, cardio" />
      </div>
      <div style={{ marginBottom: 40 }}><Btn dis={!sport} onClick={() => setS("s2")}>Continue</Btn></div>
    </Sc>
  );

  if (s === "s2") {
    const o = sport === "triathlon" ? [
      { id: "race", i: "🏁", l: "Train for a race", d: "Specific triathlon event" },
      { id: "faster", i: "⚡", l: "Get faster", d: "Improve all three disciplines" },
      { id: "longer", i: "🏔️", l: "Go longer", d: "Step up to bigger races" },
      { id: "start", i: "🌊", l: "Get into triathlon", d: "New to triathlon" },
    ] : [
      { id: "race", i: "🏁", l: "Train for a race", d: "Specific event in mind" },
      { id: "faster", i: "⚡", l: "Run faster", d: "Improve pace" },
      { id: "further", i: "🏔️", l: "Run further", d: "Build distance" },
      { id: "fitter", i: "💪", l: "Get fitter", d: "General fitness" },
    ];
    return (
      <Sc>
        <Bar s={2} t={7} /><Bk onClick={() => setS("s1")} />
        <H1>How can we help?</H1><Sb>We will tailor your training.</Sb>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {o.map(x => <Crd key={x.id} sel={goal === x.id} onClick={() => setGoal(x.id)} icon={x.i} label={x.l} desc={x.d} />)}
        </div>
        <div style={{ marginBottom: 40 }}><Btn dis={!goal} onClick={() => setS(goal === "race" ? "s3" : "s4")}>Continue</Btn></div>
      </Sc>
    );
  }

  if (s === "s3") {
    const ds = sport === "triathlon" ? ["Sprint", "Olympic", "Middle (70.3)", "Full Ironman"] : ["5K", "10K", "Half Marathon", "Marathon", "Ultra"];
    return (
      <Sc>
        <Bar s={3} t={7} /><Bk onClick={() => setS("s2")} />
        <H1>Your event</H1><Sb>We will plan around race day.</Sb>
        <Inp label="Event Name" value={evN} onChange={setEvN} placeholder={sport === "triathlon" ? "e.g. Ironman 70.3 Rwanda" : "e.g. Stanchart Marathon"} />
        <Lb>Distance</Lb>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {ds.map(d => <Pill key={d} sel={evD === d} onClick={() => setEvD(d)}>{d}</Pill>)}
        </div>
        <Inp label="Event Date" type="date" value={evDt} onChange={setEvDt} />

        {/* Goal time inputs — only for running events */}
        {sport !== "triathlon" && (
          <>
            <Lb>Goal Finish Time</Lb>
            <div style={{ fontSize: 12, color: C.tlr, marginBottom: 10, marginTop: -4 }}>We'll personalise your pace targets based on this.</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <input type="number" value={goalH} onChange={e => setGoalH(e.target.value)} placeholder="0" min="0" max="10"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 15, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                <div style={{ fontSize: 10, color: C.tlr, textAlign: "center", marginTop: 4, fontWeight: 600 }}>HOURS</div>
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" value={goalM} onChange={e => setGoalM(e.target.value)} placeholder="00" min="0" max="59"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 15, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                <div style={{ fontSize: 10, color: C.tlr, textAlign: "center", marginTop: 4, fontWeight: 600 }}>MINUTES</div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: "auto", marginBottom: 40 }}><Btn dis={!evN || !evD || !evDt} onClick={() => setS("s4")}>Continue</Btn></div>
      </Sc>
    );
  }

  if (s === "s4") {
    const ex = [
      { id: "beginner", l: "Beginner", d: "New or returning" },
      { id: "intermediate", l: "Intermediate", d: "Train regularly, have raced" },
      { id: "advanced", l: "Advanced", d: "Structured training consistently" },
      { id: "expert", l: "Expert", d: "Competitive, extensive experience" },
    ];
    return (
      <Sc>
        <Bar s={4} t={7} /><Bk onClick={() => setS(goal === "race" ? "s3" : "s2")} />
        <H1>Fitness profile</H1><Sb>Helps us tailor intensity and heart rate zones.</Sb>
        <Lb>Experience</Lb>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {ex.map(o => <Crd key={o.id} sel={exp === o.id} onClick={() => setExp(o.id)} label={o.l} desc={o.d} />)}
        </div>
        <Lb>Age</Lb>
        <div style={{ fontSize: 12, color: C.tlr, marginBottom: 8, marginTop: -4 }}>Used to calculate your personalised heart rate zones.</div>
        <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 32" min="10" max="99"
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 15, color: C.text, background: C.card, outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
        <Lb>Gender</Lb>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <Crd key={g} sel={gen === g} onClick={() => setGen(g)} label={g} />)}
        </div>
        <div style={{ marginTop: 20, marginBottom: 40 }}><Btn dis={!exp || !gen || !age || age < 10 || age > 99} onClick={() => setS("s5")}>Continue</Btn></div>
      </Sc>
    );
  }

  if (s === "s5") {
    const dl = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (
      <Sc>
        <Bar s={5} t={7} /><Bk onClick={() => setS("s4")} />
        <H1>Your training week</H1><Sb>How do you want to structure it?</Sb>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Sessions per week</div>
          <div style={{ display: "flex", gap: 8 }}>{[3, 4, 5, 6].map(n => <Pill key={n} sel={sess === n} onClick={() => setSess(n)}>{n}</Pill>)}</div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Strength and conditioning</div>
          <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map(n => <Pill key={n} sel={str === n} onClick={() => setStr(n)}>{n}</Pill>)}</div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Mobility</div>
          <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2].map(n => <Pill key={n} sel={mob === n} onClick={() => setMob(n)}>{n}</Pill>)}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Available days</div>
          <div style={{ fontSize: 12, color: C.tlr, marginBottom: 10 }}>Select at least 3</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {dl.map(d => <div key={d} onClick={() => td(d)} style={{ padding: "11px 0", borderRadius: 10, border: `2px solid ${days.includes(d) ? C.coral : C.bdr}`, background: days.includes(d) ? C.coral : C.card, color: days.includes(d) ? "#fff" : C.text, fontWeight: 600, fontSize: 12, cursor: "pointer", textAlign: "center" }}>{d}</div>)}
          </div>
        </div>
        <div style={{ marginBottom: 40 }}><Btn dis={!sess || days.length < 3} onClick={() => setS("s6")}>Continue</Btn></div>
      </Sc>
    );
  }

  if (s === "s6") return (
    <Sc>
      <Bar s={6} t={7} /><Bk onClick={() => setS("s5")} />
      <H1>Coaching style?</H1><Sb>Choose what works for you.</Sb>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <Crd sel={style === "demanding"} onClick={() => setStyle("demanding")} icon="⏱️" label="Demanding" desc="Push me hard." />
        <Crd sel={style === "friendly"} onClick={() => setStyle("friendly")} icon="💬" label="Friendly" desc="Warm and supportive." />
        <Crd sel={style === "supportive"} onClick={() => setStyle("supportive")} icon="👍" label="Supportive" desc="Patient and encouraging." />
        <Crd sel={style === "motivational"} onClick={() => setStyle("motivational")} icon="⭐" label="Motivational" desc="Keep me fired up." />
      </div>
      <div style={{ marginBottom: 40 }}><Btn dis={!style} onClick={() => { setProg(0); setS("building"); }}>Build My Plan</Btn></div>
    </Sc>
  );

  if (s === "building") return (
    <Sc>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: C.tlr }}>Nearly there</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginTop: 8 }}>BUILDING YOUR PLAN</div>
        <div style={{ width: 130, height: 130, position: "relative", margin: "36px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="130" height="130" style={{ position: "absolute" }}>
            <circle cx="65" cy="65" r="58" fill="none" stroke={C.bdr} strokeWidth="6" />
            <circle cx="65" cy="65" r="58" fill="none" stroke={C.coral} strokeWidth="6" strokeDasharray={`${prog * 3.64} 364`} strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
          </svg>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.navy }}>{prog}%</div>
        </div>
        <div style={{ fontSize: 15, color: C.tl, marginBottom: 40 }}>Personalising your plan...</div>
        <div style={{ background: `${C.navy}08`, borderRadius: 12, padding: "14px 20px", maxWidth: 280 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Tip</div>
          <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5 }}>{tips[tip]}</div>
        </div>
      </div>
    </Sc>
  );

  if (s === "summary") {
    const sl = { running: "Running", triathlon: "Triathlon", general: "General Fitness" }[sport] || "Training";
    const el = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" }[exp] || "";
    return (
      <Sc>
        <div style={{ textAlign: "center", marginTop: 32, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px" }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>YOUR PLAN IS READY</div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.bdr}`, marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{sl} — {el}</div>
          {evN && <div style={{ fontSize: 13, color: C.tl, marginTop: 4 }}>Event: {evN} - {evD}</div>}
          {evDt && <div style={{ fontSize: 13, color: C.tl }}>Date: {evDt}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[["Sessions", sess || 4], ["S&C", str || 1], ["Mobility", mob || 1]].map(([l, v]) => (
              <div key={l} style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.tlr, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, borderLeft: `3px solid ${C.coral}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>From Coach Silas</div>
          <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5, fontStyle: "italic", marginTop: 2 }}>"Welcome to Kinetic. Every session has a purpose. Trust the process."</div>
        </div>
        <div style={{ marginBottom: 40 }}><Btn onClick={() => setS("signup")}>Create Account to Save Plan</Btn></div>
      </Sc>
    );
  }

  if (s === "signup") return (
    <Sc>
      <Bk onClick={() => setS("summary")} />
      <H1>Save your plan</H1><Sb>Create your account.</Sb>
      <Inp label="Full Name" value={name} onChange={setName} placeholder="e.g. Winnie Moraa" />
      <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <Inp label="Password" type="password" value={pw} onChange={setPw} placeholder="At least 6 characters" />
      {err && <div style={{ color: C.coral, fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ marginTop: "auto", marginBottom: 40 }}>
        <Btn dis={ld || !name || !email.includes("@") || pw.length < 6} onClick={doSignUp}>{ld ? "Creating..." : "Create Account"}</Btn>
      </div>
    </Sc>
  );

  return null;
}

// ===== ATHLETE DASHBOARD =====
function AthleteDash({ user, token, uname, onLogout }) {
  const [tab, setTab] = useState("today");
  const [weeks, setWeeks] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selW, setSelW] = useState(null);
  const [comps, setComps] = useState([]);
  const [detail, setDetail] = useState(null);
  const [fb, setFb] = useState({ r: 0, n: "" });
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [currentWeekNum, setCurrentWeekNum] = useState(1);
  const [plan, setPlan] = useState(null);
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [screenshotUpload, setScreenshotUpload] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      // Load athlete profile for personalization
      const profiles = await api.get("athlete_profiles", token, `user_id=eq.${user.id}&limit=1`);
      if (profiles && profiles.length > 0) {
        setAthleteProfile(profiles[0]);
      }
      let plans = await api.get("training_plans", token, `athlete_id=eq.${user.id}&status=eq.active&order=created_at.desc&limit=1`);
      if (!plans || plans.length === 0) {
        plans = await api.get("training_plans", token, `coach_id=eq.${COACH_ID}&status=eq.active&order=created_at.desc&limit=1`);
      }
      if (plans && plans.length > 0) {
        const planData = plans[0];
        setPlan(planData);
        const pid = planData.id;
        const w = await api.get("training_weeks", token, `plan_id=eq.${pid}&order=week_number`);
        setWeeks(w || []);
        if (w && w.length > 0) {
          const planStart = planData.start_date ? new Date(planData.start_date) : null;
          const today = new Date();
          let currentWeekIdx = 0;
          if (planStart) {
            const daysSinceStart = Math.floor((today - planStart) / (1000 * 60 * 60 * 24));
            const weeksSinceStart = Math.floor(daysSinceStart / 7);
            currentWeekIdx = Math.max(0, Math.min(weeksSinceStart, w.length - 1));
          }
          setCurrentWeekNum(w[currentWeekIdx].week_number);
          setSelW(w[currentWeekIdx].id);
          const wids = w.map(x => `"${x.id}"`).join(",");
          const wo = await api.get("workouts", token, `week_id=in.(${wids})&order=day_of_week`);
          setWorkouts(wo || []);
        }
        const co = await api.get("workout_completions", token, `athlete_id=eq.${user.id}`);
        setComps(co || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleDone = (wid) => {
    if (comps.find(c => c.workout_id === wid)) {
      setComps(p => p.filter(c => c.workout_id !== wid));
    } else {
      setComps(p => [...p, { workout_id: wid, athlete_id: user.id, difficulty_rating: 3 }]);
      try { api.post("workout_completions", { workout_id: wid, athlete_id: user.id, difficulty_rating: 3 }, token); } catch (e) { }
    }
  };

  const saveFb = async () => {
    if (!detail) return;
    const compData = { 
      workout_id: detail.id, 
      athlete_id: user.id, 
      difficulty_rating: fb.r, 
      athlete_notes: fb.n,
      screenshot_url: screenshotUpload?.data || null
    };
    try { await api.post("workout_completions", compData, token); } catch (e) { }
    setComps(p => [...p, compData]);
    showToast(screenshotUpload ? "Session logged with screenshot!" : "Session logged! Coach Silas can see your feedback.");
    setDetail(null);
    setFb({ r: 0, n: "" });
    setScreenshotUpload(null);
  };

  const doSwap = async (wid, newDay) => {
    try { await api.patch("workouts", `id=eq.${wid}`, { day_of_week: newDay }, token); } catch (e) { }
    setWorkouts(p => p.map(w => w.id === wid ? { ...w, day_of_week: newDay } : w));
    setSwap(null);
    showToast("Workout moved to " + DN[newDay] + "!");
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const cw = weeks.find(w => w.id === selW);
  const cwk = workouts.filter(w => w.week_id === selW).sort((a, b) => a.day_of_week - b.day_of_week);
  const doneC = cwk.filter(w => comps.some(c => c.workout_id === w.id)).length;
  const totalC = cwk.filter(w => w.workout_type !== "rest").length;

  // SWAP MODAL
  if (swap) return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", padding: 20 }}>
      <Bk onClick={() => setSwap(null)} />
      <H1>Move workout</H1>
      <Sb>Pick the new day for "{swap.title}"</Sb>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6, 7].map(d => {
          const isCur = swap.day_of_week === d;
          return (
            <div key={d} onClick={() => !isCur && doSwap(swap.id, d)} style={{
              background: isCur ? C.bdr : C.card, border: `1.5px solid ${C.bdr}`, borderRadius: 12,
              padding: "16px 18px", cursor: isCur ? "default" : "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isCur ? 0.5 : 1,
            }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{DN[d]}</span>
              {isCur && <span style={{ fontSize: 12, color: C.tlr }}>Current</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // WORKOUT DETAIL
  if (detail) {
    const m = TM[detail.workout_type] || TM.rest;
    let st = {};
    try { st = typeof detail.structure === "string" ? JSON.parse(detail.structure) : detail.structure || {}; } catch (e) { }

    // ===== SMART PLAN PERSONALIZATION =====
    const raceDistance = getRaceDistance(plan?.plan_name);
    const goalSec = athleteProfile?.goal_time_seconds;
    const racePace = (raceDistance && goalSec) ? goalSec / raceDistance : null;
    const paces = racePace ? calcPaces(racePace) : null;
    const hrZones = calcHRZones(athleteProfile?.age);
    const zoneNum = parseZone(detail.target_hr_zone);
    const expMult = EXPERIENCE_MULTIPLIER[athleteProfile?.experience_level] || 1.0;

    // Pace for this specific workout
    const paceKey = WORKOUT_PACE_KEY[detail.workout_type];
    const workoutPace = paces && paceKey ? paces[paceKey] : null;

    // Adjusted duration based on experience
    const adjustedDuration = detail.duration_minutes ? Math.round(detail.duration_minutes * expMult) : null;

    // HR zone range
    const hrRange = hrZones && zoneNum ? hrZones[`zone${zoneNum}`] : null;

    const hasPersonalization = (workoutPace || hrRange) && detail.workout_type !== "rest";

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Workout Detail</div>
        </div>
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 7, height: 38, borderRadius: 4, background: m.c }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.c, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.i} {m.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{detail.title}</div>
            </div>
          </div>

          {/* PERSONALISED TARGETS CARD */}
          {hasPersonalization && (
            <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.coral} 100%)`, borderRadius: 14, padding: 16, marginBottom: 14, color: "#fff" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🎯 Your Personalised Targets</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {workoutPace && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Target Pace</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{fmtPace(workoutPace)}</div>
                  </div>
                )}
                {hrRange && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Heart Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{hrRange[0]}–{hrRange[1]} bpm</div>
                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Zone {zoneNum}</div>
                  </div>
                )}
                {adjustedDuration && adjustedDuration !== detail.duration_minutes && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Duration</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>~{adjustedDuration} min</div>
                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Adjusted for {athleteProfile?.experience_level}</div>
                  </div>
                )}
                {paces && paceKey !== "easy" && (
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Easy Warm-up</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{fmtPace(paces.easy)}</div>
                  </div>
                )}
              </div>
              {goalSec && raceDistance && (
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  Based on your {Math.floor(goalSec / 3600)}h {Math.floor((goalSec % 3600) / 60)}min goal for {raceDistance}K
                </div>
              )}
            </div>
          )}

          {detail.why_text && <div style={{ background: C.cbg, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Coach Silas Says</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{detail.why_text}</div>
          </div>}
          {detail.description && <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.6, marginBottom: 14 }}>{detail.description}</div>}
          {(st.warmup || st.main || st.cooldown) && <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.bdr}`, marginBottom: 14 }}>
            {st.warmup && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", marginBottom: 3 }}>Warm-up{paces ? ` · ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.warmup}</div></div>}
            {st.main && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", marginBottom: 3 }}>Main Set{workoutPace ? ` · ${fmtPace(workoutPace)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.main}</div></div>}
            {st.cooldown && <div><div style={{ fontSize: 11, fontWeight: 700, color: C.lb, textTransform: "uppercase", marginBottom: 3 }}>Cool-down{paces ? ` · ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.cooldown}</div></div>}
          </div>}
          {detail.coach_notes && <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${C.coral}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>Coach Notes</div>
            <div style={{ fontSize: 12, color: C.tl, lineHeight: 1.5, fontStyle: "italic", marginTop: 2 }}>{detail.coach_notes}</div>
          </div>}
          {detail.duration_minutes && <div style={{ fontSize: 12, color: C.tlr, marginBottom: 14 }}>Plan duration: {detail.duration_minutes} min {detail.target_hr_zone ? ` | ${detail.target_hr_zone}` : ""}</div>}
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 10 }}>How did it feel?</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(r => (
              <div key={r} onClick={() => setFb(f => ({ ...f, r }))} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                background: fb.r === r ? C.cbg : C.card, border: `2px solid ${fb.r === r ? C.coral : C.bdr}`,
              }}>
                <div style={{ fontSize: 22 }}>{EMO[r]}</div>
                <div style={{ fontSize: 9, color: C.tlr, marginTop: 2 }}>{EML[r]}</div>
              </div>
            ))}
          </div>
          <textarea value={fb.n} onChange={e => setFb(f => ({ ...f, n: e.target.value }))} placeholder="Notes for Coach Silas?"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 13, resize: "none", height: 70, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

          {/* Screenshot upload — Strava/Garmin */}
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Upload workout screenshot (optional)</div>
          <div style={{ fontSize: 12, color: C.tlr, marginBottom: 10 }}>Take a screenshot from Strava, Garmin, or your watch app so Coach Silas can see your actual workout data.</div>
          <label style={{ display: "block", background: screenshotUpload ? `${C.green}08` : C.card, borderRadius: 12, padding: 16, border: `2px dashed ${screenshotUpload ? C.green : C.bdr}`, textAlign: "center", cursor: "pointer", marginBottom: 14 }}>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setScreenshotUpload({ name: file.name, data: ev.target.result });
                reader.readAsDataURL(file);
              }
            }} style={{ display: "none" }} />
            {screenshotUpload ? (
              <div>
                <img src={screenshotUpload.data} alt="screenshot" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ {screenshotUpload.name}</div>
                <div style={{ fontSize: 11, color: C.tlr, marginTop: 2 }}>Tap to change</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 26, marginBottom: 4 }}>📸</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Tap to upload screenshot</div>
                <div style={{ fontSize: 11, color: C.tlr, marginTop: 2 }}>From Strava, Garmin, Apple Watch, etc.</div>
              </div>
            )}
          </label>

          <Btn dis={!fb.r} onClick={saveFb}>Mark Complete</Btn>
          <div style={{ height: 30 }} />
        </div>
      </div>
    );
  }

  // TODAY TAB
  if (tab === "today") {
    const today = new Date();
    const todayDow = today.getDay() === 0 ? 7 : today.getDay();
    const todayWorkouts = cwk.filter(w => w.day_of_week === todayDow);
    const weekDone = cwk.filter(w => comps.some(c => c.workout_id === w.id)).length;
    const weekTotal = cwk.filter(w => w.workout_type !== "rest").length;

    // Streak: count consecutive completed weeks
    let streak = 0;
    for (let i = currentWeekNum - 1; i >= 1; i--) {
      const wk = weeks.find(w => w.week_number === i);
      if (!wk) break;
      const wkWorkouts = workouts.filter(w => w.week_id === wk.id && w.workout_type !== "rest");
      const wkDone = wkWorkouts.filter(w => comps.some(c => c.workout_id === w.id)).length;
      if (wkWorkouts.length > 0 && wkDone >= wkWorkouts.length * 0.6) streak++;
      else break;
    }
    // Add current week to streak if going well
    if (weekTotal > 0 && weekDone >= weekTotal * 0.6) streak++;

    // Race readiness: total completed workouts / total planned workouts up to current week
    const planAllWorkouts = workouts.filter(w => w.workout_type !== "rest");
    const planTotalToDate = workouts.filter(w => {
      const wk = weeks.find(x => x.id === w.week_id);
      return wk && wk.week_number <= currentWeekNum && w.workout_type !== "rest";
    }).length;
    const planDone = comps.length;
    const readiness = planTotalToDate > 0 ? Math.min(100, Math.round(planDone / planTotalToDate * 100)) : 0;

    // Days to race
    const raceDate = plan?.end_date ? new Date(plan.end_date) : null;
    const daysToRace = raceDate ? Math.max(0, Math.floor((raceDate - today) / (1000 * 60 * 60 * 24))) : null;

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 13, color: C.tlr }}>
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginTop: 4 }}>
            Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"}, {uname || "Athlete"}
          </div>
        </div>

        {/* Race Readiness Hero Card */}
        {plan && (
          <div style={{ margin: "16px 20px 0", background: `linear-gradient(135deg, ${C.navy} 0%, ${C.coral} 100%)`, borderRadius: 16, padding: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>Race Readiness</div>
                <div style={{ fontSize: 44, fontWeight: 800, marginTop: 4, lineHeight: 1 }}>{readiness}%</div>
                {daysToRace !== null && (
                  <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
                    {daysToRace > 0 ? `${daysToRace} days to race day` : "Race day!"}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>🔥 {streak}</div>
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Week Streak</div>
              </div>
            </div>
            <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)" }}>
              <div style={{ height: 6, borderRadius: 3, background: "#fff", width: `${readiness}%`, transition: "width 0.5s" }} />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 10, padding: "14px 20px" }}>
          <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.coral }}>{planDone}</div>
            <div style={{ fontSize: 10, color: C.tlr, fontWeight: 600, marginTop: 2 }}>Sessions Done</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{weekDone}/{weekTotal}</div>
            <div style={{ fontSize: 10, color: C.tlr, fontWeight: 600, marginTop: 2 }}>This Week</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{currentWeekNum}</div>
            <div style={{ fontSize: 10, color: C.tlr, fontWeight: 600, marginTop: 2 }}>Week</div>
          </div>
        </div>

        {/* Today's workout */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Today's Session</div>
          {todayWorkouts.length > 0 ? todayWorkouts.map(w => {
            const m = TM[w.workout_type] || TM.rest;
            const isR = w.workout_type === "rest";
            const done = comps.some(c => c.workout_id === w.id);
            return (
              <div key={w.id} onClick={() => !isR && setDetail(w)} style={{
                background: done ? `${C.green}06` : C.card, borderRadius: 16, padding: 20,
                border: `1px solid ${done ? `${C.green}20` : C.bdr}`, borderLeft: `5px solid ${m.c}`,
                cursor: isR ? "default" : "pointer", marginBottom: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: m.c, padding: "3px 10px", borderRadius: 16 }}>{m.i} {m.l}</div>
                  {done && <div style={{ fontSize: 10, fontWeight: 700, color: C.green, background: `${C.green}10`, padding: "3px 8px", borderRadius: 16 }}>Completed ✓</div>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isR ? C.tlr : C.navy, marginBottom: 6 }}>{w.title}</div>
                {/* Prominent coach message at top of workout — Coopah style */}
                {w.why_text && !isR && (
                  <div style={{ background: C.cbg, borderRadius: 10, padding: "10px 14px", margin: "10px 0", borderLeft: `3px solid ${C.coral}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.coral, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Coach Silas Says</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>{w.why_text}</div>
                  </div>
                )}
                <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5 }}>{w.description}</div>
                {w.duration_minutes && <div style={{ fontSize: 12, color: C.tlr, marginTop: 8 }}>Duration: {w.duration_minutes} min {w.target_hr_zone ? `| ${w.target_hr_zone}` : ""}</div>}
                {!isR && !done && <div style={{ marginTop: 12 }}><Btn onClick={(e) => { e.stopPropagation(); setDetail(w); }}>View & Complete</Btn></div>}
              </div>
            );
          }) : (
            <div style={{ background: C.card, borderRadius: 16, padding: 24, textAlign: "center", border: `1px solid ${C.bdr}` }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>😴</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Rest Day</div>
              <div style={{ fontSize: 13, color: C.tl, marginTop: 4 }}>No session today. Recovery is training.</div>
            </div>
          )}
        </div>

        {/* Up next */}
        {cwk.filter(w => w.day_of_week > todayDow && w.workout_type !== "rest").length > 0 && (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Coming Up</div>
            {cwk.filter(w => w.day_of_week > todayDow && w.workout_type !== "rest").slice(0, 3).map(w => {
              const m = TM[w.workout_type] || TM.rest;
              return (
                <div key={w.id} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6, display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${m.c}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.tlr, width: 28 }}>{DN[w.day_of_week]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{w.title}</div>
                    {w.duration_minutes && <div style={{ fontSize: 11, color: C.tlr }}>{w.duration_minutes} min</div>}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: m.c, padding: "2px 8px", borderRadius: 12 }}>{m.i}</div>
                </div>
              );
            })}
          </div>
        )}

        <Nav tab={tab} setTab={setTab} />
      </div>
    );
  }

  // PROGRESS TAB
  if (tab === "progress") {
    const types = ["run_intervals", "run_tempo", "run_easy", "run_long", "strength", "mobility", "swim", "bike"];
    const typeCounts = types.map(t => {
      const total = cwk.filter(w => w.workout_type === t).length;
      const done = cwk.filter(w => w.workout_type === t && comps.some(c => c.workout_id === w.id)).length;
      return { type: t, total, done };
    }).filter(x => x.total > 0);

    // Weekly report generation
    const avgRating = comps.filter(c => c.difficulty_rating).length > 0
      ? (comps.filter(c => c.difficulty_rating).reduce((s, c) => s + c.difficulty_rating, 0) / comps.filter(c => c.difficulty_rating).length).toFixed(1)
      : 0;
    const completionRate = totalC > 0 ? Math.round(doneC / totalC * 100) : 0;
    const feedbackCount = comps.filter(c => c.athlete_notes).length;
    
    let reportStatus = "";
    let reportColor = C.green;
    if (completionRate >= 80) { reportStatus = "Excellent progress"; reportColor = C.green; }
    else if (completionRate >= 60) { reportStatus = "Good progress"; reportColor = C.teal; }
    else if (completionRate >= 40) { reportStatus = "Getting there"; reportColor = C.coral; }
    else { reportStatus = "Needs attention"; reportColor = C.coral; }

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <div style={{ padding: "16px 20px", background: "rgba(244,241,248,0.95)", position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>Progress</div>
          <div style={{ fontSize: 13, color: C.tlr }}>{cw?.focus_label || "Your training progress"}</div>
        </div>
        <div style={{ padding: 20 }}>
          {/* Weekly Report Card */}
          <div style={{ background: C.card, borderRadius: 14, padding: 20, border: `1px solid ${C.bdr}`, marginBottom: 16, borderLeft: `4px solid ${reportColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: reportColor, textTransform: "uppercase", letterSpacing: 1 }}>Weekly Report</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 2 }}>{reportStatus}</div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: reportColor }}>{completionRate}%</div>
            </div>
            <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5, marginTop: 6 }}>
              You have completed <strong>{doneC} of {totalC}</strong> planned sessions this week.
              {avgRating > 0 && <> Average effort rating: <strong>{avgRating}/5</strong>.</>}
              {feedbackCount > 0 && <> You left <strong>{feedbackCount}</strong> notes for Coach Silas.</>}
            </div>
            <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "10px 14px", marginTop: 12, borderLeft: `3px solid ${C.coral}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>Coach Note</div>
              <div style={{ fontSize: 12, color: C.tl, lineHeight: 1.5, marginTop: 3, fontStyle: "italic" }}>
                {completionRate >= 80 ? "Excellent consistency. Trust the process — you're building real fitness." :
                  completionRate >= 60 ? "Solid week. Keep showing up. Consistency beats intensity." :
                  completionRate >= 40 ? "Every session counts. Focus on showing up this week." :
                  "Let me know what's blocking you. We can adjust the plan."}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 12 }}>By Session Type</div>
          {typeCounts.map(({ type, total, done }) => {
            const m = TM[type] || TM.rest;
            return (
              <div key={type} style={{ background: C.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.bdr}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 18 }}>{m.i}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.l}</span><span style={{ fontSize: 12, color: C.tlr }}>{done}/{total}</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: C.bdr }}><div style={{ height: 6, borderRadius: 3, background: m.c, width: `${total > 0 ? done / total * 100 : 0}%` }} /></div>
                </div>
              </div>
            );
          })}

          {/* Recent feedback */}
          {comps.filter(c => c.athlete_notes).length > 0 && (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 20, marginBottom: 10 }}>Your Recent Notes</div>
              {comps.filter(c => c.athlete_notes).slice(-3).reverse().map((c, i) => {
                const w = workouts.find(x => x.id === c.workout_id);
                return (
                  <div key={i} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{w?.title || "Workout"}</span>
                      <span style={{ fontSize: 16 }}>{EMO[c.difficulty_rating] || ""}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.tl, marginTop: 3, fontStyle: "italic" }}>{c.athlete_notes}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <Nav tab={tab} setTab={setTab} />
      </div>
    );
  }

  // PROFILE TAB
  if (tab === "profile") return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.bdr}` }}><div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>Profile</div></div>
      <div style={{ padding: 20 }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.bdr}`, textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.cbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: C.coral, margin: "0 auto 12px" }}>{(uname || "A")[0]}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{uname || "Athlete"}</div>
          <div style={{ fontSize: 13, color: C.tlr, marginTop: 4 }}>{user?.email}</div>
        </div>
        <div style={{ marginTop: 20 }}><Btn sec onClick={onLogout}>Log Out</Btn></div>
      </div>
      <Nav tab={tab} setTab={setTab} />
    </div>
  );

  // PLAN TAB
  const selWeekObj = weeks.find(w => w.id === selW);
  const isLocked = selWeekObj && selWeekObj.week_number > currentWeekNum;
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "14px 20px", background: "rgba(244,241,248,0.95)", position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: C.tlr }}>Training Plan</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{plan?.plan_name || "Your Plan"}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>K<span style={{ color: C.coral }}>.</span></div>
        </div>
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: C.tlr }}>Loading your plan...</div> : (
        <>
          {weeks.length > 0 && <div style={{ padding: "12px 20px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Select Week</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
              {weeks.map(w => {
                const sel = w.id === selW;
                const ph = w.focus_label?.split("—")?.[0]?.trim() || "Base";
                const pc = PHASES[ph]?.color || C.green;
                const locked = w.week_number > currentWeekNum;
                return (
                  <div key={w.id} onClick={() => setSelW(w.id)} style={{
                    minWidth: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: sel ? pc : locked ? "#F0EDF5" : C.card,
                    color: sel ? "#fff" : locked ? C.tlr : C.text,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    border: `2px solid ${sel ? pc : locked ? C.bdr : C.bdr}`,
                    flexShrink: 0, position: "relative", opacity: locked && !sel ? 0.6 : 1,
                  }}>
                    {w.week_number}
                    {locked && <div style={{ position: "absolute", top: -4, right: -4, background: C.tlr, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>🔒</div>}
                  </div>
                );
              })}
            </div>
          </div>}
          {cw && <div style={{ margin: "10px 20px 0", padding: 14, borderRadius: 12, background: isLocked ? `${C.tlr}10` : `${C.green}10`, border: `1px solid ${isLocked ? `${C.tlr}20` : `${C.green}20`}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isLocked ? C.tlr : C.green, textTransform: "uppercase", letterSpacing: 1 }}>{cw.focus_label}</div>
            <div style={{ fontSize: 12, color: C.tl, marginTop: 4 }}>Week {cw.week_number} {isLocked ? "— Unlocks as you progress" : `— ${doneC}/${totalC} sessions`}</div>
            {!isLocked && <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: C.bdr }}><div style={{ height: 5, borderRadius: 3, background: C.green, width: `${totalC ? doneC / totalC * 100 : 0}%` }} /></div>}
          </div>}
          {isLocked && (
            <div style={{ margin: "14px 20px", padding: "20px 16px", background: C.card, borderRadius: 12, border: `1px dashed ${C.bdr}`, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Week {cw?.week_number} is locked</div>
              <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5, marginBottom: 12 }}>Complete Week {currentWeekNum} first. Coach Silas will reveal future sessions as you progress — this keeps your training responsive to how your body is adapting.</div>
              <div style={{ fontSize: 12, color: C.coral, fontWeight: 600 }}>Focus on what's in front of you.</div>
            </div>
          )}
          {!isLocked && <div style={{ padding: "10px 0" }}>
            {cwk.map(w => {
              const m = TM[w.workout_type] || TM.rest;
              const isR = w.workout_type === "rest";
              const done = comps.some(c => c.workout_id === w.id);
              return (
                <div key={w.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 20px 3px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.tlr, textTransform: "uppercase", width: 28 }}>{DN[w.day_of_week]}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: m.c, padding: "2px 8px", borderRadius: 14 }}>{m.i} {m.l}</div>
                  </div>
                  <div style={{ margin: "0 20px", padding: "12px 14px", background: done ? `${C.green}06` : C.card, borderLeft: `4px solid ${m.c}`, borderRadius: 10, border: `1px solid ${done ? `${C.green}20` : C.bdr}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    {!isR && <div onClick={(e) => { e.stopPropagation(); toggleDone(w.id); }} style={{ width: 20, height: 20, borderRadius: 6, marginTop: 1, border: `2px solid ${done ? C.green : C.bdr}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>}
                    <div style={{ flex: 1, cursor: isR ? "default" : "pointer" }} onClick={() => !isR && setDetail(w)}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isR ? C.tlr : C.text, textDecoration: done ? "line-through" : "none" }}>{w.title}</div>
                      <div style={{ fontSize: 12, color: C.tlr, marginTop: 2, lineHeight: 1.4 }}>{w.description?.substring(0, 80)}{(w.description?.length || 0) > 80 ? "..." : ""}</div>
                      {w.duration_minutes && <div style={{ fontSize: 11, color: C.tlr, marginTop: 3 }}>Duration: {w.duration_minutes} min</div>}
                    </div>
                    {!isR && <div onClick={(e) => { e.stopPropagation(); setSwap(w); }} style={{ fontSize: 10, fontWeight: 700, color: C.coral, textTransform: "uppercase", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>Move</div>}
                  </div>
                </div>
              );
            })}
          </div>}
          {weeks.length === 0 && <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>No plan yet</div>
            <div style={{ fontSize: 13, color: C.tl, marginTop: 8 }}>Coach Silas will assign your plan soon.</div>
          </div>}
        </>
      )}
      <Nav tab={tab} setTab={setTab} />
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: "0 8px 30px rgba(27,43,90,0.25)", maxWidth: 340, textAlign: "center", zIndex: 20 }}>{toast}</div>}
    </div>
  );
}

// ===== COACH DASHBOARD =====
function CoachDash({ user, token, uname, onLogout }) {
  const [athletes, setAthletes] = useState([]);
  const [ld, setLd] = useState(true);
  const [view, setView] = useState("roster");
  const [selA, setSelA] = useState(null);
  const [aComps, setAComps] = useState([]);
  const [csvName, setCsvName] = useState("");
  const [csvRows, setCsvRows] = useState([]);

  const [allComps, setAllComps] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);

  useEffect(() => { loadAthletes(); }, []);

  const loadAthletes = async () => {
    try {
      const a = await api.get("athlete_profiles", token, `coach_id=eq.${user.id}&select=*,profiles:user_id(full_name,email)`);
      setAthletes(a || []);
      if (a && a.length > 0) {
        const athleteIds = a.map(x => `"${x.user_id}"`).join(",");
        const comps = await api.get("workout_completions", token, `athlete_id=in.(${athleteIds})&order=id.desc&limit=100`);
        setAllComps(comps || []);
        setAllFeedback((comps || []).filter(c => c.athlete_notes));
      }
    } catch (e) { }
    setLd(false);
  };

  const viewAthlete = async (a) => {
    setSelA(a);
    setView("athlete");
    try {
      const co = await api.get("workout_completions", token, `athlete_id=eq.${a.user_id}`);
      setAComps(co || []);
    } catch (e) { }
  };

  // ATHLETE DETAIL
  if (view === "athlete" && selA) {
    const aName = selA.profiles?.full_name || selA.profiles?.email || "Athlete";
    const feedbacks = aComps.filter(c => c.athlete_notes);
    const screenshots = aComps.filter(c => c.screenshot_url);
    const recentActivity = aComps.slice(0, 10);
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.bdr}` }}>
          <button onClick={() => setView("roster")} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{aName}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[["Sport", selA.sport_type || "—", C.navy], ["Level", selA.experience_level || "—", C.green], ["Done", String(aComps.length), C.coral]].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: C.tlr, fontWeight: 600, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Workout Screenshots from Athlete */}
          {screenshots.length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 18, marginBottom: 10 }}>Workout Screenshots ({screenshots.length})</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16 }}>
                {screenshots.slice(0, 10).map((c, i) => (
                  <div key={i} style={{ minWidth: 100, height: 130, background: C.card, borderRadius: 10, border: `1px solid ${C.bdr}`, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                    <img src={c.screenshot_url} alt="workout" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", borderRadius: 10, padding: "2px 6px", fontSize: 11 }}>{EMO[c.difficulty_rating] || ""}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 18, marginBottom: 10 }}>Athlete Feedback</div>
          {feedbacks.length > 0 ? feedbacks.slice(-5).reverse().map((c, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Session</span>
                <span style={{ fontSize: 16 }}>{EMO[c.difficulty_rating] || ""}</span>
              </div>
              <div style={{ fontSize: 12, color: C.tl, marginTop: 3, fontStyle: "italic" }}>"{c.athlete_notes}"</div>
            </div>
          )) : <div style={{ fontSize: 13, color: C.tlr, textAlign: "center", padding: 16 }}>No feedback yet.</div>}
        </div>
      </div>
    );
  }

  // INSIGHTS
  if (view === "insights") return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.bdr}` }}>
        <button onClick={() => setView("roster")} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Coach Insights</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: `${C.green}10`, borderRadius: 10, padding: 12, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{athletes.length}</div><div style={{ fontSize: 11, color: C.tl }}>Athletes</div></div>
          <div style={{ flex: 1, background: C.cbg, borderRadius: 10, padding: 12, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.coral }}>2</div><div style={{ fontSize: 11, color: C.tl }}>Active Plans</div></div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Athlete Status</div>
        {athletes.map((a, i) => {
          const nm = a.profiles?.full_name || a.profiles?.email || "Athlete";
          return (
            <div key={i} style={{ background: C.card, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.green }}>{nm[0]}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{nm}</div></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, background: `${C.green}10`, padding: "3px 8px", borderRadius: 16 }}>Active</div>
            </div>
          );
        })}
        <div style={{ background: `${C.navy}06`, borderRadius: 12, padding: 16, borderLeft: `3px solid ${C.coral}`, marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Coaching Reminder</div>
          <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.6, marginTop: 4 }}>"We are building control, not chasing speed."</div>
        </div>
      </div>
    </div>
  );

  // UPLOAD
  if (view === "upload") {
    const handleCsv = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        const rows = lines.slice(1).map(line => {
          const vals = []; let cur = ""; let inQ = false;
          for (const ch of line) { if (ch === '"') inQ = !inQ; else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; } else cur += ch; }
          vals.push(cur.trim());
          const obj = {}; headers.forEach((h, i) => obj[h] = vals[i] || ""); return obj;
        });
        setCsvRows(rows); setCsvName(f.name);
      };
      reader.readAsText(f);
    };

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.bdr}` }}>
          <button onClick={() => setView("roster")} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Upload Training Plan</div>
        </div>
        <div style={{ padding: 20 }}>
          <Sb>Upload a CSV with your training plan.</Sb>
          <label style={{ display: "block", background: C.card, borderRadius: 14, padding: 24, border: `2px dashed ${C.bdr}`, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <input type="file" accept=".csv" onChange={handleCsv} style={{ display: "none" }} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Tap to select CSV file</div>
          </label>
          {csvName && <div style={{ background: `${C.green}10`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>✓ {csvName} — {csvRows.length} weeks</div>
          </div>}
          {csvRows.length > 0 && <div style={{ marginBottom: 16 }}>
            {csvRows.slice(0, 3).map((r, i) => <div key={i} style={{ background: C.card, borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.bdr}`, marginBottom: 4, fontSize: 12, color: C.tl }}><strong>{r.Week || `Week ${i + 1}`}</strong> — {r.Focus || Object.values(r).slice(1, 3).join(", ")}</div>)}
          </div>}
          <Btn dis={!csvRows.length} onClick={async () => {
            try {
              // Create a new training plan
              const planId = crypto.randomUUID();
              await api.post("training_plans", {
                id: planId, athlete_id: user.id, coach_id: user.id,
                plan_name: csvName.replace(".csv", ""), start_date: new Date().toISOString().split("T")[0],
                status: "active"
              }, token);
              // Create weeks and workouts for each row
              const dayMap = { "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7, "Monday": 1 };
              for (let i = 0; i < csvRows.length; i++) {
                const row = csvRows[i];
                const weekId = crypto.randomUUID();
                const weekNum = i + 1;
                const focus = row.Focus || row.focus || `Week ${weekNum}`;
                await api.post("training_weeks", {
                  id: weekId, plan_id: planId, week_number: weekNum,
                  start_date: new Date(Date.now() + i * 7 * 86400000).toISOString().split("T")[0],
                  focus_label: focus
                }, token);
                // Parse each day column into a workout
                const cols = Object.keys(row).filter(k => k !== "Week" && k !== "week" && k !== "Focus" && k !== "focus" && k !== "Fuel/Hydration Notes" && k !== "Form/Cues");
                for (const col of cols) {
                  if (!row[col] || row[col].trim() === "") continue;
                  const dayName = col.split(" - ")[0].split(" ")[0].trim();
                  const dow = dayMap[dayName] || dayMap[Object.keys(dayMap).find(k => col.toLowerCase().includes(k.toLowerCase()))] || 1;
                  let wtype = "run_easy";
                  const lower = col.toLowerCase() + " " + (row[col] || "").toLowerCase();
                  if (lower.includes("track") || lower.includes("interval")) wtype = "run_intervals";
                  else if (lower.includes("strength")) wtype = "strength";
                  else if (lower.includes("easy")) wtype = "run_easy";
                  else if (lower.includes("mobility") || lower.includes("cross")) wtype = "mobility";
                  else if (lower.includes("hill") || lower.includes("steady") || lower.includes("tempo")) wtype = "run_tempo";
                  else if (lower.includes("long")) wtype = "run_long";
                  else if (lower.includes("swim")) wtype = "swim";
                  else if (lower.includes("bike") || lower.includes("cycle")) wtype = "bike";
                  else if (lower.includes("rest")) wtype = "rest";
                  const durMatch = row[col].match(/(\d+)\s*min/);
                  const duration = durMatch ? parseInt(durMatch[1]) : null;
                  await api.post("workouts", {
                    week_id: weekId, day_of_week: dow, workout_type: wtype,
                    title: col.includes(" - ") ? col.split(" - ")[1].trim() : col,
                    description: row[col], why_text: "", duration_minutes: duration,
                    structure: "{}", coach_notes: row["Form/Cues"] || row["Fuel/Hydration Notes"] || ""
                  }, token);
                }
              }
              setCsvRows([]); setCsvName(""); setView("roster");
            } catch (e) { console.error(e); }
          }}>Upload Plan to Database</Btn>
        </div>
      </div>
    );
  }

  // ROSTER
  // Calculate per-athlete stats for risk flagging
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const athleteStats = athletes.map(a => {
    const comps = allComps.filter(c => c.athlete_id === a.user_id);
    const recentComps = comps.filter(c => c.created_at ? new Date(c.created_at) > sevenDaysAgo : true);
    const avgRating = comps.filter(c => c.difficulty_rating).length > 0
      ? (comps.filter(c => c.difficulty_rating).reduce((s, c) => s + c.difficulty_rating, 0) / comps.filter(c => c.difficulty_rating).length)
      : null;
    // Risk: no completions this week, or avg rating <= 2 (struggling)
    let risk = "on-track";
    if (comps.length === 0) risk = "inactive";
    else if (recentComps.length < 2) risk = "at-risk";
    else if (avgRating !== null && avgRating <= 2) risk = "struggling";
    return { ...a, totalComps: comps.length, recentComps: recentComps.length, avgRating, risk };
  });

  const atRiskAthletes = athleteStats.filter(a => a.risk === "at-risk" || a.risk === "struggling" || a.risk === "inactive");
  const onTrackAthletes = athleteStats.filter(a => a.risk === "on-track");

  const riskMeta = {
    "on-track": { label: "On Track", color: C.green },
    "at-risk": { label: "Needs Attention", color: C.coral },
    "struggling": { label: "Struggling", color: C.coral },
    "inactive": { label: "Inactive", color: C.tlr },
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
      <div style={{ padding: "14px 20px", background: "rgba(244,241,248,0.95)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: C.tlr }}>Coach Dashboard</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{uname || "Coach Silas"}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>K<span style={{ color: C.coral }}>.</span></div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {/* Top stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{athletes.length}</div>
            <div style={{ fontSize: 9, color: C.tlr, fontWeight: 600, marginTop: 2 }}>ATHLETES</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{onTrackAthletes.length}</div>
            <div style={{ fontSize: 9, color: C.tlr, fontWeight: 600, marginTop: 2 }}>ON TRACK</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${atRiskAthletes.length > 0 ? `${C.coral}30` : C.bdr}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: atRiskAthletes.length > 0 ? C.coral : C.tlr }}>{atRiskAthletes.length}</div>
            <div style={{ fontSize: 9, color: C.tlr, fontWeight: 600, marginTop: 2 }}>AT RISK</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["📊", "Insights", () => setView("insights")], ["📤", "Upload Plan", () => setView("upload")]].map(([i, l, fn]) => (
            <div key={l} onClick={fn} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}`, cursor: "pointer" }}>
              <div style={{ fontSize: 20 }}>{i}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Attention Needed Section */}
        {atRiskAthletes.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.coral }}>⚠️ Attention Needed</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.coral, padding: "2px 8px", borderRadius: 10 }}>{atRiskAthletes.length}</div>
            </div>
            {atRiskAthletes.map((a, i) => {
              const meta = riskMeta[a.risk];
              return (
                <div key={i} onClick={() => viewAthlete(a)} style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.coral}20`, borderLeft: `4px solid ${C.coral}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${C.coral}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.coral }}>{(a.profiles?.full_name || "A")[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{a.profiles?.full_name || a.profiles?.email || "Athlete"}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginTop: 2 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: C.tlr, marginTop: 2 }}>{a.recentComps} sessions this week • {a.totalComps} total</div>
                  </div>
                  <div style={{ fontSize: 18, color: C.bdr }}>›</div>
                </div>
              );
            })}
            <div style={{ height: 16 }} />
          </>
        )}

        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 10 }}>All Athletes</div>
        {ld ? <div style={{ color: C.tlr }}>Loading...</div> :
          athletes.length > 0 ? athleteStats.map((a, i) => {
            const meta = riskMeta[a.risk];
            return (
              <div key={i} onClick={() => viewAthlete(a)} style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.bdr}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.cbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.coral }}>{(a.profiles?.full_name || "A")[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{a.profiles?.full_name || a.profiles?.email || "Athlete"}</div>
                  <div style={{ fontSize: 12, color: C.tlr }}>{a.sport_type || "Running"} — {a.totalComps} sessions completed</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: `${meta.color}15`, padding: "3px 8px", borderRadius: 10 }}>{meta.label}</div>
              </div>
            );
          }) : <div style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>No athletes yet</div>
            <div style={{ fontSize: 13, color: C.tl, marginTop: 4 }}>Athletes appear when they sign up.</div>
          </div>}

        {/* Recent Feedback Feed */}
        {allFeedback.length > 0 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 24, marginBottom: 10 }}>Recent Feedback</div>
            {allFeedback.slice(0, 5).map((c, i) => {
              const athlete = athletes.find(a => a.user_id === c.athlete_id);
              const aName = athlete?.profiles?.full_name || athlete?.profiles?.email || "Athlete";
              return (
                <div key={i} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{aName}</span>
                    <span style={{ fontSize: 16 }}>{EMO[c.difficulty_rating] || ""}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.tl, marginTop: 3, fontStyle: "italic" }}>"{c.athlete_notes}"</div>
                </div>
              );
            })}
          </>
        )}

        <div style={{ marginTop: 24 }}><Btn sec onClick={onLogout}>Log Out</Btn></div>
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function Kinetic() {
  const [auth, setAuth] = useState(null);
  if (!auth) return <Onboarding onComplete={setAuth} />;
  const logout = () => setAuth(null);
  if (auth.role === "coach") return <CoachDash user={auth.user} token={auth.token} uname={auth.name} onLogout={logout} />;
  return <AthleteDash user={auth.user} token={auth.token} uname={auth.name} onLogout={logout} />;
}
