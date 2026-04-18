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


// ===== ATHLETE DASHBOARD — REDESIGNED =====
function AthleteDash({ user, token, uname, onLogout }) {
  const [tab, setTab] = useState("today");
  const [weeks, setWeeks] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selW, setSelW] = useState(null);
  const [comps, setComps] = useState([]);
  const [detail, setDetail] = useState(null);
  const [fb, setFb] = useState({ effort: 0, pace: "", feel: "", notes: "" });
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [currentWeekNum, setCurrentWeekNum] = useState(1);
  const [plan, setPlan] = useState(null);
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [editPlan, setEditPlan] = useState(false);
  const [editWeek, setEditWeek] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const profiles = await api.get("athlete_profiles", token, `user_id=eq.${user.id}&limit=1`);
      if (profiles && profiles.length > 0) setAthleteProfile(profiles[0]);
      let plans = await api.get("training_plans", token, `athlete_id=eq.${user.id}&status=eq.active&order=created_at.desc&limit=1`);
      if (!plans || plans.length === 0) plans = await api.get("training_plans", token, `coach_id=eq.${COACH_ID}&status=eq.active&order=created_at.desc&limit=1`);
      if (plans && plans.length > 0) {
        const p = plans[0]; setPlan(p);
        const w = await api.get("training_weeks", token, `plan_id=eq.${p.id}&order=week_number`);
        setWeeks(w || []);
        if (w && w.length > 0) {
          const ps = p.start_date ? new Date(p.start_date) : null;
          let idx = 0;
          if (ps) { const d = Math.floor((new Date() - ps) / 86400000); idx = Math.max(0, Math.min(Math.floor(d / 7), w.length - 1)); }
          setCurrentWeekNum(w[idx].week_number); setSelW(w[idx].id);
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

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const cw = weeks.find(w => w.id === selW);
  const cwk = workouts.filter(w => w.week_id === selW).sort((a, b) => a.day_of_week - b.day_of_week);
  const doneC = cwk.filter(w => comps.some(c => c.workout_id === w.id)).length;
  const totalC = cwk.filter(w => w.workout_type !== "rest").length;

  // Pace calculations
  const raceDistance = getRaceDistance(plan?.plan_name);
  const goalSec = athleteProfile?.goal_time_seconds;
  const racePace = (raceDistance && goalSec) ? goalSec / raceDistance : null;
  const paces = racePace ? calcPaces(racePace) : null;
  const hrZones = calcHRZones(athleteProfile?.age);

  // Confidence & metrics
  const allNonRest = workouts.filter(w => w.workout_type !== "rest");
  const toDateWorkouts = workouts.filter(w => { const wk = weeks.find(x => x.id === w.week_id); return wk && wk.week_number <= currentWeekNum && w.workout_type !== "rest"; });
  const confidence = toDateWorkouts.length > 0 ? Math.min(100, Math.round(comps.length / toDateWorkouts.length * 100)) : 0;
  const totalPlannedKm = toDateWorkouts.reduce((s, w) => s + (w.distance_km || 0), 0);
  const volumePct = totalPlannedKm > 0 ? Math.min(100, Math.round(comps.length / toDateWorkouts.length * 100)) : 0;

  // Plan dates
  const raceDate = plan?.end_date ? new Date(plan.end_date) : null;
  const daysToRace = raceDate ? Math.max(0, Math.floor((raceDate - new Date()) / 86400000)) : null;
  const planStart = plan?.start_date ? new Date(plan.start_date) : null;

  // Week mileage for overview chart
  const weekMileages = weeks.map(w => {
    const wkWorkouts = workouts.filter(x => x.week_id === w.id);
    return wkWorkouts.reduce((s, x) => s + (x.distance_km || 0), 0);
  });

  const saveFb = async () => {
    if (!detail) return;
    const d = { workout_id: detail.id, athlete_id: user.id, difficulty_rating: fb.effort, athlete_notes: `Pace: ${fb.pace || "—"} | Feel: ${fb.feel || "—"} | ${fb.notes}`.trim() };
    try { await api.post("workout_completions", d, token); } catch (e) { }
    setComps(p => [...p, d]);
    showToast("Session logged!");
    setDetail(null); setFb({ effort: 0, pace: "", feel: "", notes: "" });
  };

  const doSwap = async (wid, newDay) => {
    try { await api.patch("workouts", `id=eq.${wid}`, { day_of_week: newDay }, token); } catch (e) { }
    setWorkouts(p => p.map(w => w.id === wid ? { ...w, day_of_week: newDay } : w));
    setSwap(null); showToast("Moved to " + DN[newDay]);
  };

  // ===== NAV =====
  const NavBar = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `1px solid ${C.bdr}`, display: "flex", padding: "6px 0 22px", zIndex: 10 }}>
      {[{ i: "☀️", l: "Today", id: "today" }, { i: "📋", l: "Plan", id: "plan" }, { i: "📅", l: "Train", id: "train" }, { i: "📊", l: "Progress", id: "progress" }, { i: "•••", l: "More", id: "more" }].map(t => (
        <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>{t.i}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? C.coral : C.tlr }}>{t.l}</span>
        </div>
      ))}
    </div>
  );

  // ===== SWAP MODAL =====
  if (swap) return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", padding: 20 }}>
      <Bk onClick={() => setSwap(null)} /><H1>Move workout</H1><Sb>Pick the new day for "{swap.title}"</Sb>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1,2,3,4,5,6,7].map(d => {
          const cur = swap.day_of_week === d;
          return <div key={d} onClick={() => !cur && doSwap(swap.id, d)} style={{ background: cur ? C.bdr : C.card, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "16px 18px", cursor: cur ? "default" : "pointer", display: "flex", justifyContent: "space-between", opacity: cur ? 0.5 : 1 }}><span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{DN[d]}</span>{cur && <span style={{ fontSize: 12, color: C.tlr }}>Current</span>}</div>;
        })}
      </div>
    </div>
  );

  // ===== WORKOUT DETAIL (Coopah-style) =====
  if (detail) {
    const m = TM[detail.workout_type] || TM.rest;
    let st = {}; try { st = typeof detail.structure === "string" ? JSON.parse(detail.structure) : detail.structure || {}; } catch (e) { }
    const isRun = detail.workout_type?.startsWith("run_");
    const paceKey = WORKOUT_PACE_KEY[detail.workout_type];
    const wp = paces && paceKey ? paces[paceKey] : null;
    const zn = parseZone(detail.target_hr_zone);
    const hr = hrZones && zn ? hrZones[`zone${zn}`] : null;
    const done = comps.some(c => c.workout_id === detail.id);
    const isRest = detail.workout_type === "rest";

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh" }}>
        {/* Header gradient */}
        {isRun && <div style={{ background: `linear-gradient(135deg, ${C.teal}40 0%, ${C.green}30 100%)`, padding: "50px 20px 20px", borderRadius: "0 0 20px 20px" }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: C.navy, cursor: "pointer", marginBottom: 10 }}>←</button>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, background: `${C.navy}15`, display: "inline-block", padding: "4px 12px", borderRadius: 20, marginBottom: 10 }}>{m.l}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{detail.title}</div>
        </div>}
        {!isRun && <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: m.c }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{detail.title}</div></div>
        </div>}

        <div style={{ padding: "16px 20px" }}>
          {/* Time / Distance / Pace cards */}
          {(detail.duration_minutes || detail.distance_km || wp) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {detail.duration_minutes && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Time</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{detail.duration_minutes >= 60 ? `${Math.floor(detail.duration_minutes/60)}h ${detail.duration_minutes%60}m` : `~${detail.duration_minutes}min`}</div></div>}
              {detail.distance_km && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Distance</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{detail.distance_km}km</div></div>}
              {wp && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Avg pace</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{fmtPace(wp)}</div></div>}
            </div>
          )}

          {/* Coach's message */}
          {detail.why_text && <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>!</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Coach's message</div></div>
            <div style={{ fontSize: 14, color: C.tl, lineHeight: 1.6 }}>{detail.why_text}</div>
          </div>}

          {/* Workout structure */}
          {(st.warmup || st.main || st.cooldown) && <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
            {st.warmup && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", marginBottom: 3 }}>Warm-up {paces ? `· ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.warmup}</div></div>}
            {st.main && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", marginBottom: 3 }}>Main Set {wp ? `· ${fmtPace(wp)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.main}</div></div>}
            {st.cooldown && <div><div style={{ fontSize: 11, fontWeight: 700, color: C.lb, textTransform: "uppercase", marginBottom: 3 }}>Cool-down {paces ? `· ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.cooldown}</div></div>}
          </div>}

          {/* HR Zone */}
          {hr && <div style={{ background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.bdr}`, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Heart Rate Zone {zn}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 2 }}>{hr[0]}–{hr[1]} bpm</div></div>
            <div style={{ fontSize: 11, color: C.tlr }}>Effort: {zn <= 2 ? "3/10" : zn === 3 ? "7/10" : "8/10"}</div>
          </div>}

          {/* Coach notes */}
          {detail.coach_notes && <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${C.coral}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>Coach Notes</div>
            <div style={{ fontSize: 12, color: C.tl, lineHeight: 1.5, fontStyle: "italic", marginTop: 2 }}>{detail.coach_notes}</div>
          </div>}

          {/* SESSION CHECK-IN — Coopah style, NO emojis */}
          {!isRest && !done && (
            <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 14 }}>📋</span><span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Session check-in</span></div>
              <div style={{ fontSize: 12, color: C.tlr, marginBottom: 16 }}>Your answers help us adapt your plan for smarter training.</div>

              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Rate your perceived effort</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {[1,2,3,4,5].map(r => (
                  <div key={r} onClick={() => setFb(f => ({...f, effort: r}))} style={{ flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", cursor: "pointer", background: fb.effort === r ? `${C.navy}15` : C.bg, border: `1.5px solid ${fb.effort === r ? C.navy : C.bdr}`, fontWeight: fb.effort === r ? 700 : 500, fontSize: 15, color: fb.effort === r ? C.navy : C.tl }}>{r}</div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>How were your target paces?</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["Too slow", "Just right", "Too fast"].map(o => (
                  <div key={o} onClick={() => setFb(f => ({...f, pace: o}))} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: fb.pace === o ? `${C.navy}15` : C.bg, border: `1.5px solid ${fb.pace === o ? C.navy : C.bdr}`, fontWeight: fb.pace === o ? 700 : 500, fontSize: 12, color: fb.pace === o ? C.navy : C.tl }}>{o}</div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>How did you feel?</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["Tired", "Normal", "Strong"].map(o => (
                  <div key={o} onClick={() => setFb(f => ({...f, feel: o}))} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: fb.feel === o ? `${C.navy}15` : C.bg, border: `1.5px solid ${fb.feel === o ? C.navy : C.bdr}`, fontWeight: fb.feel === o ? 700 : 500, fontSize: 13, color: fb.feel === o ? C.navy : C.tl }}>{o}</div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Your session notes</div>
              <textarea value={fb.notes} onChange={e => setFb(f => ({...f, notes: e.target.value}))} placeholder="Tap to add notes" maxLength={500}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 13, resize: "none", height: 80, outline: "none", boxSizing: "border-box", marginBottom: 4, background: C.bg }} />
              <div style={{ fontSize: 11, color: C.tlr, textAlign: "right", marginBottom: 14 }}>{fb.notes.length}/500</div>
            </div>
          )}

          {done && <div style={{ background: `${C.green}10`, borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 16, border: `1px solid ${C.green}20` }}><div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>✓ Session Completed</div></div>}

          {!isRest && !done && <Btn dis={!fb.effort} onClick={saveFb}>Save</Btn>}
          <div style={{ height: 30 }} />
        </div>
      </div>
    );
  }

  // ===== TODAY TAB =====
  if (tab === "today") {
    const today = new Date();
    const todayDow = today.getDay() === 0 ? 7 : today.getDay();
    const todayWorkouts = cwk.filter(w => w.day_of_week === todayDow);
    const tw = todayWorkouts[0];
    const twDone = tw ? comps.some(c => c.workout_id === tw.id) : false;
    const twMeta = tw ? (TM[tw.workout_type] || TM.rest) : null;

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>TODAY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 14 }}>🔥</span><span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{comps.length > 0 ? Math.min(comps.length, 30) : 0}</span></div>
        </div>

        {/* Greeting */}
        <div style={{ padding: "0 20px 14px", borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"}, {uname || "Athlete"}</div>
          <div style={{ fontSize: 13, color: C.tl, marginTop: 2 }}>{cw?.focus_label || "Keep showing up. Every session matters."}</div>
        </div>

        {/* TODAY'S FOCUS */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Today's Focus</div>
          {tw ? (
            <div onClick={() => tw.workout_type !== "rest" && setDetail(tw)} style={{ background: `linear-gradient(135deg, ${twMeta.c}90, ${twMeta.c}60)`, borderRadius: 16, padding: 20, cursor: tw.workout_type === "rest" ? "default" : "pointer", position: "relative" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "uppercase", marginBottom: 4 }}>{tw.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{tw.description?.substring(0, 100)}</div>
              {(tw.duration_minutes || tw.distance_km) && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 10 }}>
                  {tw.duration_minutes && `${tw.duration_minutes >= 60 ? Math.floor(tw.duration_minutes/60)+"h "+tw.duration_minutes%60+"m" : tw.duration_minutes+"min"}`}
                  {tw.distance_km && ` · ${tw.distance_km}km`}
                  {wp && ` · ${fmtPace(WORKOUT_PACE_KEY[tw.workout_type] ? paces[WORKOUT_PACE_KEY[tw.workout_type]] : null)}`}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                {twDone ? <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff" }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div><span style={{ fontSize: 13, fontWeight: 600 }}>Completed</span></div>
                  : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Tap to view</div>}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>{twMeta.l}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 16, padding: 24, textAlign: "center", border: `1px solid ${C.bdr}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>😴</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Rest Day</div>
              <div style={{ fontSize: 13, color: C.tl, marginTop: 4 }}>No session today. Recovery is training.</div>
            </div>
          )}
        </div>

        {/* YOUR PROGRESS */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Your Progress</div>
          <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Confidence gauge */}
              <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke={C.bdr} strokeWidth="8" strokeDasharray="198 264" strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "center" }} />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={C.teal} strokeWidth="8" strokeDasharray={`${confidence * 1.98} 264`} strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "center" }} />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{confidence}%</div>
                  <div style={{ fontSize: 9, color: C.tlr, fontWeight: 600 }}>Confidence</div>
                </div>
              </div>

              {/* Metrics bars */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Pace</span><span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>On track</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: C.bdr }}><div style={{ height: 6, borderRadius: 3, background: C.green, width: `${Math.min(100, confidence + 10)}%` }} /></div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Volume</span><span style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>{volumePct}%</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: C.bdr }}><div style={{ height: 6, borderRadius: 3, background: C.coral, width: `${volumePct}%` }} /></div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Consistency</span><span style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>{(confidence / 14).toFixed(1)}</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: C.bdr }}><div style={{ height: 6, borderRadius: 3, background: C.teal, width: `${Math.min(100, confidence)}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NavBar />
      </div>
    );
  }

  // ===== PLAN TAB =====
  if (tab === "plan") {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <div style={{ padding: "16px 20px" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>PLAN</div></div>

        {/* Current Plan Card */}
        {plan && <div style={{ margin: "0 20px", background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.coral, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Current plan</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginTop: 4 }}>{athleteProfile?.event_name || plan.plan_name}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {goalSec && <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.tlr }}>Time</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{Math.floor(goalSec/3600)}:{String(Math.floor((goalSec%3600)/60)).padStart(2,"0")}:{String(goalSec%60).padStart(2,"0")}</div></div>}
            {racePace && <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.tlr }}>Pace</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{fmtPace(racePace)}</div></div>}
            {paces && <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.tlr }}>Easy pace</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{fmtPace(paces.easy)}</div></div>}
          </div>

          {planStart && raceDate && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: C.tl }}>📅 {planStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {raceDate.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>}
          {daysToRace !== null && <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: C.bdr }}><div style={{ height: 6, borderRadius: 3, background: C.green, width: `${Math.max(5, 100 - (daysToRace / (weeks.length * 7) * 100))}%` }} /></div>}

          <div style={{ marginTop: 14 }}><Btn onClick={() => setEditPlan(true)}>Edit plan</Btn></div>
        </div>}

        {/* PLAN PHASE */}
        <div style={{ margin: "0 20px", background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 14 }}>PLAN PHASE</div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            {[{ n: "Foundation", w: "2 Weeks", c: C.green, active: currentWeekNum <= 2 }, { n: "Build", w: "8 Weeks", c: C.teal, active: currentWeekNum > 2 && currentWeekNum <= 10 }, { n: "Taper", w: "2 Weeks", c: C.purple, active: currentWeekNum > 10 }].map((p, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: `4px solid ${p.active ? p.c : C.bdr}`, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 20, color: p.active ? p.c : C.tlr }}>{i === 0 ? "〰️" : i === 1 ? "⚡" : "🎯"}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.active ? C.navy : C.tlr }}>{p.n}</div>
                <div style={{ fontSize: 11, color: C.tlr }}>{p.w}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OVERVIEW — Week by week mileage */}
        <div style={{ margin: "0 20px", background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 4 }}>OVERVIEW</div>
          <div style={{ fontSize: 12, color: C.tlr, marginBottom: 16 }}>Week by week mileage of your plan</div>
          {weekMileages.length > 0 && (
            <div style={{ position: "relative", height: 120 }}>
              <svg width="100%" height="120" viewBox={`0 0 ${weekMileages.length * 60} 120`} style={{ overflow: "visible" }}>
                {weekMileages.map((km, i) => {
                  const maxKm = Math.max(...weekMileages, 1);
                  const x = i * 60 + 30; const y = 100 - (km / maxKm * 80);
                  const nx = (i + 1) < weekMileages.length ? (i + 1) * 60 + 30 : null;
                  const ny = nx !== null ? 100 - (weekMileages[i + 1] / maxKm * 80) : null;
                  return (<g key={i}>
                    {nx !== null && <line x1={x} y1={y} x2={nx} y2={ny} stroke={C.bdr} strokeWidth="2" />}
                    <circle cx={x} cy={y} r="5" fill={i + 1 <= currentWeekNum ? C.teal : C.bdr} stroke="#fff" strokeWidth="2" />
                    <text x={x} y={y - 12} textAnchor="middle" fill={C.navy} fontSize="10" fontWeight="700">{Math.round(km)}km</text>
                    <text x={x} y={115} textAnchor="middle" fill={C.tlr} fontSize="9">W{i+1}</text>
                  </g>);
                })}
              </svg>
            </div>
          )}
        </div>

        <NavBar />
      </div>
    );
  }

  // ===== TRAIN TAB (Coopah-style weekly view) =====
  if (tab === "train") {
    const weekStartDate = cw?.start_date ? new Date(cw.start_date) : planStart ? new Date(planStart.getTime() + (currentWeekNum - 1) * 7 * 86400000) : new Date();
    const weekTotalKm = cwk.reduce((s, w) => s + (w.distance_km || 0), 0);
    const weekTotalMin = cwk.reduce((s, w) => s + (w.duration_minutes || 0), 0);

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>TRAIN</div>
        </div>

        {/* Week selector */}
        <div style={{ padding: "0 20px 12px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { const prev = weeks.find(w => w.week_number === (cw?.week_number || 1) - 1); if (prev) setSelW(prev.id); }} style={{ background: "none", border: "none", fontSize: 18, color: C.tl, cursor: "pointer" }}>‹</button>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Week {cw?.week_number || 1}</div><div style={{ fontSize: 12, color: C.tlr }}>{Math.round(weekTotalKm)}km · {weekTotalMin >= 60 ? `${Math.floor(weekTotalMin/60)}h ${weekTotalMin%60}min` : `${weekTotalMin}min`}</div></div>
            <button onClick={() => { const next = weeks.find(w => w.week_number === (cw?.week_number || 1) + 1); if (next) setSelW(next.id); }} style={{ background: "none", border: "none", fontSize: 18, color: C.tl, cursor: "pointer" }}>›</button>
          </div>
        </div>

        {/* Focus label */}
        {cw && <div style={{ padding: "0 20px 8px", fontSize: 12, color: C.teal, fontWeight: 600 }}>Week {cw.week_number}: {cw.focus_label}</div>}

        {/* Workout list — Coopah style */}
        <div style={{ padding: "0 0 10px" }}>
          {cwk.map(w => {
            const m = TM[w.workout_type] || TM.rest;
            const isR = w.workout_type === "rest";
            const done = comps.some(c => c.workout_id === w.id);
            const dayDate = weekStartDate ? new Date(weekStartDate.getTime() + (w.day_of_week - 1) * 86400000) : null;
            const isToday = dayDate && dayDate.toDateString() === new Date().toDateString();

            return (
              <div key={w.id} onClick={() => !isR && setDetail(w)} style={{ display: "flex", alignItems: "stretch", padding: "0 20px", cursor: isR ? "default" : "pointer" }}>
                {/* Day label */}
                <div style={{ width: 52, paddingTop: 14, paddingBottom: 14, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? C.coral : C.tlr, textTransform: "uppercase" }}>{DN[w.day_of_week]}</div>
                  {dayDate && <div style={{ fontSize: 10, color: C.tlr }}>{dayDate.getDate()} {dayDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</div>}
                </div>

                {/* Color bar */}
                <div style={{ width: 4, borderRadius: 2, background: isR ? C.bdr : m.c, margin: "8px 12px", flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, padding: "12px 0", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: done ? `${C.green}04` : "transparent", opacity: isR ? 0.5 : 1 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isR ? C.tlr : C.text }}>{w.title}</div>
                    {!isR && <div style={{ fontSize: 12, color: C.tlr, marginTop: 2 }}>
                      {w.duration_minutes && `~${w.duration_minutes >= 60 ? Math.floor(w.duration_minutes/60)+"h "+w.duration_minutes%60+"m" : w.duration_minutes+"min"}`}
                      {w.distance_km && ` · ${w.distance_km}km`}
                    </div>}
                  </div>
                  {done && <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span></div>}
                  {!isR && !done && <div style={{ fontSize: 18, color: C.bdr }}>›</div>}
                </div>
              </div>
            );
          })}
        </div>

        <NavBar />
        {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 13, boxShadow: "0 8px 30px rgba(27,43,90,0.25)", maxWidth: 340, textAlign: "center", zIndex: 20 }}>{toast}</div>}
      </div>
    );
  }

  // ===== PROGRESS TAB =====
  if (tab === "progress") {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <div style={{ padding: "16px 20px" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>PROGRESS</div></div>

        {/* Goal Confidence */}
        <div style={{ margin: "0 20px 16px", background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}` }}>
          {goalSec && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><div style={{ width: 3, height: 24, borderRadius: 2, background: C.navy }} /><div><div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{Math.floor(goalSec/3600)}:{String(Math.floor((goalSec%3600)/60)).padStart(2,"0")}:{String(goalSec%60).padStart(2,"0")}</div><div style={{ fontSize: 11, color: C.tlr }}>Your target time</div></div></div>}
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="56" fill="none" stroke={C.bdr} strokeWidth="10" strokeDasharray="264 352" strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "center" }} />
                <circle cx="70" cy="70" r="56" fill="none" stroke={C.teal} strokeWidth="10" strokeDasharray={`${confidence * 2.64} 352`} strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "center" }} />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.navy }}>{confidence}%</div>
                <div style={{ fontSize: 11, color: C.tlr }}>Confidence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Metrics */}
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Training Metrics</div>
          {[
            { n: "Pace", v: "On track", c: C.green, pct: Math.min(100, confidence + 10), desc: "How your completed speed work compares to planned target paces." },
            { n: "Volume", v: `${volumePct}%`, c: C.coral, pct: volumePct, desc: "Total distance completed vs planned runs." },
            { n: "Consistency", v: (confidence / 14).toFixed(1), c: C.teal, pct: Math.min(100, confidence), desc: "How consistently you've completed planned training." }
          ].map((m, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.n}</span><span style={{ fontSize: 13, fontWeight: 700, color: m.c }}>{m.v}</span></div>
              <div style={{ height: 6, borderRadius: 3, background: C.bdr, marginBottom: 8 }}><div style={{ height: 6, borderRadius: 3, background: m.c, width: `${m.pct}%` }} /></div>
              <div style={{ fontSize: 12, color: C.tl, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Weekly Coach Report */}
        <div style={{ margin: "0 20px", background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 14 }}>WEEKLY COACH REPORT</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.tl, marginBottom: 12 }}>Week {currentWeekNum} Summary</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{doneC}</div>
              <div style={{ fontSize: 11, color: C.tlr }}>of {totalC} sessions</div>
            </div>
            <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{Math.round(cwk.filter(w => comps.some(c => c.workout_id === w.id)).reduce((s, w) => s + (w.distance_km || 0), 0))}km</div>
              <div style={{ fontSize: 11, color: C.tlr }}>of {Math.round(cwk.reduce((s, w) => s + (w.distance_km || 0), 0))}km target</div>
            </div>
          </div>

          {/* Coach insight */}
          <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${C.coral}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Coach's Insight</div>
            <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5, marginTop: 4 }}>
              {doneC >= totalC ? "Perfect week! Every session completed. Outstanding commitment." :
                doneC >= totalC * 0.6 ? "Solid week. Keep this consistency going and trust the process." :
                "Focus on completing your key sessions this week. Show up, even when it's hard."}
            </div>
          </div>
        </div>

        <NavBar />
      </div>
    );
  }

  // ===== MORE TAB =====
  if (tab === "more") return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: "16px 20px" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>MORE</div></div>
      <div style={{ padding: "0 20px" }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.bdr}`, textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.cbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: C.coral, margin: "0 auto 12px" }}>{(uname || "A")[0]}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{uname || "Athlete"}</div>
          <div style={{ fontSize: 13, color: C.tlr, marginTop: 4 }}>{user?.email}</div>
          {athleteProfile && <div style={{ fontSize: 12, color: C.tl, marginTop: 8 }}>{athleteProfile.sport_type} · {athleteProfile.experience_level} · Age {athleteProfile.age}</div>}
        </div>
        <div style={{ marginTop: 20 }}><Btn sec onClick={onLogout}>Log Out</Btn></div>
      </div>
      <NavBar />
    </div>
  );

  // Default
  return <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", padding: 40, textAlign: "center", color: C.tlr }}>Loading...</div>;
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
