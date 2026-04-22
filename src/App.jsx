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

const C = { bg: "#F4F1F8", card: "#FFF", coral: "#E85D4A", navy: "#1B2B5A", text: "#1A1A2E", tl: "#6B6B80", tlr: "#9494A8", teal: "#2AA6A6", green: "#4CAF50", purple: "#7B6B8A", wg: "#A89B8C", bdr: "#E8E4F0", lb: "#7BA7CC", cbg: "rgba(232,93,74,0.08)", lavender: "#E8EDF5" };

// Training type colours — locked in from conversation
const TC = {
  interval: "#2C3E6B",   // navy
  easy: "#92B4D9",       // light blue
  tempo: "#7A3D4E",      // burgundy
  long: "#7B6A9E",       // purple
  steady: "#6BA39B",     // teal
  hill: "#5A7A4E",       // forest green
  strength: "#D4675A",   // coral
  rest: "#C4C4C4",       // grey
};

const TM = {
  run_easy: { l: "Easy Run", c: TC.easy, cat: "easy" },
  run_tempo: { l: "Tempo", c: TC.tempo, cat: "tempo" },
  run_intervals: { l: "Intervals", c: TC.interval, cat: "interval" },
  run_long: { l: "Long Run", c: TC.long, cat: "long" },
  run_steady: { l: "Steady Run", c: TC.steady, cat: "steady" },
  run_hill: { l: "Hill Repeats", c: TC.hill, cat: "hill" },
  swim: { l: "Swim", c: C.teal, cat: "swim" },
  bike: { l: "Bike", c: C.green, cat: "bike" },
  strength: { l: "Strength", c: TC.strength, cat: "strength" },
  mobility: { l: "Mobility", c: C.wg, cat: "mobility" },
  rest: { l: "Rest", c: TC.rest, cat: "rest" }
};

const DN = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
  run_steady: "steady",
  run_hill: "interval",
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

// Classify a workout into one of our training type categories (for colour-coding)
const classifyWorkout = (w) => {
  if (!w) return "rest";
  if (TM[w.workout_type]) return TM[w.workout_type].cat;
  const t = ((w.title || "") + " " + (w.description || "")).toLowerCase();
  if (t.includes("interval") || t.includes("amsterdam") || t.includes("×") || t.includes(" x ")) return "interval";
  if (t.includes("hill")) return "hill";
  if (t.includes("tempo")) return "tempo";
  if (t.includes("long")) return "long";
  if (t.includes("steady")) return "steady";
  if (t.includes("easy")) return "easy";
  if (t.includes("strength") || t.includes("s&c") || t.includes("circuit")) return "strength";
  if (t.includes("rest")) return "rest";
  if (t.includes("swim")) return "swim";
  if (t.includes("bike") || t.includes("cycle")) return "bike";
  return "easy";
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

// Standard page-header used across tabs: TITLE + streak + Chat to Coach pill
const PageHeader = ({ title, streak, onChatTap }) => (
  <div style={{ background: C.lavender, padding: "16px 20px 16px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, letterSpacing: 0.5 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={C.coral}><path d="M12 2C12 6 7 7 7 13a5 5 0 0010 0c0-3-2-5-2-5s-1 3-3 3c0-4 0-6 0-9z"/></svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{streak}</span>
        </div>
        <div onClick={onChatTap} style={{ background: "#fff", border: `1px solid ${C.bdr}`, borderRadius: 24, padding: "6px 10px 6px 14px", fontSize: 13, fontWeight: 600, color: C.navy, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          Chat to Coach
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.navy, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⋮</span>
        </div>
      </div>
    </div>
  </div>
);

// ===== ONBOARDING (unchanged from original) =====
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
          user_id: si.user.id, sport_type: sport, experience_level: exp, gender: gen,
          age: age ? parseInt(age) : null,
          sessions_per_week: sess || 4, available_days: days, strength_per_week: str || 1,
          mobility_per_week: mob || 1, coaching_style: style, coach_id: COACH_ID,
          goal_time_seconds: goalSeconds > 0 ? goalSeconds : null,
          race_distance: evD || null, event_name: evN || null, event_date: evDt || null,
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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [currentWeekNum, setCurrentWeekNum] = useState(1);
  const [plan, setPlan] = useState(null);
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [planTab, setPlanTab] = useState("current"); // current | future
  const [progTab, setProgTab] = useState("statistics"); // statistics | achievements
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

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
  const handleChatTap = () => setShowChatModal(true);
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

  // Confidence & metrics (placeholder calculation — flagged for Coach Silas to define rules)
  const toDateWorkouts = workouts.filter(w => { const wk = weeks.find(x => x.id === w.week_id); return wk && wk.week_number <= currentWeekNum && w.workout_type !== "rest"; });
  const confidence = toDateWorkouts.length > 0 ? Math.min(100, Math.round(comps.length / toDateWorkouts.length * 100)) : 0;
  const totalPlannedKm = toDateWorkouts.reduce((s, w) => s + (w.distance_km || 0), 0);
  const volumePct = totalPlannedKm > 0 ? Math.min(100, Math.round(comps.length / toDateWorkouts.length * 100)) : 0;

  // Plan dates
  const raceDate = plan?.end_date ? new Date(plan.end_date) : null;
  const daysToRace = raceDate ? Math.max(0, Math.floor((raceDate - new Date()) / 86400000)) : null;
  const planStart = plan?.start_date ? new Date(plan.start_date) : null;
  const totalWeeks = weeks.length || 12;

  // Week mileage for overview chart
  const weekMileages = weeks.map(w => {
    const wkWorkouts = workouts.filter(x => x.week_id === w.id);
    return wkWorkouts.reduce((s, x) => s + (x.distance_km || 0), 0);
  });

  // Plan phase calculation based on week position (Base 2wk, Strength 8wk, Speed taper-1, Taper final)
  const totalW = weeks.length || 12;
  const basePhase = Math.max(1, Math.round(totalW * 0.17));  // ~2 of 12
  const strengthPhase = basePhase + Math.max(4, Math.round(totalW * 0.5));  // ~6 weeks
  const speedPhase = strengthPhase + Math.max(1, Math.round(totalW * 0.17));  // ~2 weeks
  const phases = [
    { name: "Base", weeks: basePhase, startWeek: 1, endWeek: basePhase },
    { name: "Strength", weeks: strengthPhase - basePhase, startWeek: basePhase + 1, endWeek: strengthPhase },
    { name: "Speed", weeks: speedPhase - strengthPhase, startWeek: strengthPhase + 1, endWeek: speedPhase },
    { name: "Taper", weeks: Math.max(1, totalW - speedPhase), startWeek: speedPhase + 1, endWeek: totalW },
  ];
  const currentPhaseIdx = phases.findIndex(p => currentWeekNum >= p.startWeek && currentWeekNum <= p.endWeek);
  const currentPhase = phases[currentPhaseIdx] || phases[0];
  const phaseProgress = currentPhase ? ((currentWeekNum - currentPhase.startWeek + 1) / currentPhase.weeks) * 100 : 0;

  const saveFb = async () => {
    if (!detail) return;
    const d = { workout_id: detail.id, athlete_id: user.id, difficulty_rating: fb.effort, athlete_notes: `Pace: ${fb.pace || "—"} | Feel: ${fb.feel || "—"} | ${fb.notes}`.trim() };
    try { await api.post("workout_completions", d, token); } catch (e) { }
    setComps(p => [...p, d]);
    showToast("Session logged!");
    setDetail(null); setFb({ effort: 0, pace: "", feel: "", notes: "" });
  };

  const NavBar = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `1px solid ${C.bdr}`, display: "flex", padding: "6px 0 22px", zIndex: 10 }}>
      {[
        { i: "☀️", l: "Today", id: "today" },
        { i: "📋", l: "Plan", id: "plan" },
        { i: "📅", l: "Train", id: "train" },
        { i: "📊", l: "Progress", id: "progress" },
        { i: "•••", l: "More", id: "more" },
      ].map(t => (
        <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>{t.i}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? C.coral : C.tlr }}>{t.l}</span>
        </div>
      ))}
    </div>
  );

  // Chat modal shared across tabs
  const ChatModal = () => showChatModal && (
    <div onClick={() => setShowChatModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, maxWidth: 430, margin: "0 auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 22px 36px", width: "100%", maxWidth: 430, textAlign: "center" }}>
        <div style={{ width: 40, height: 4, background: C.bdr, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ width: 56, height: 56, background: C.navy, color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, margin: "0 auto 14px" }}>CS</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Coach Silas</div>
        <div style={{ fontSize: 14, color: C.tl, lineHeight: 1.5, marginBottom: 20, padding: "0 8px" }}>Coming soon — you'll be able to message Coach Silas here.</div>
        <Btn onClick={() => setShowChatModal(false)}>Got it</Btn>
      </div>
    </div>
  );

  // ===== WORKOUT DETAIL =====
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
        {isRun && <div style={{ background: `linear-gradient(135deg, ${m.c}AA 0%, ${m.c}70 100%)`, padding: "50px 20px 20px", borderRadius: "0 0 20px 20px" }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: "#fff", cursor: "pointer", marginBottom: 10 }}>←</button>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.25)", display: "inline-block", padding: "4px 12px", borderRadius: 20, marginBottom: 10 }}>{m.l}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{detail.title}</div>
        </div>}
        {!isRun && <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: C.tl, cursor: "pointer" }}>←</button>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: m.c }}>{m.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{detail.title}</div></div>
        </div>}

        <div style={{ padding: "16px 20px" }}>
          {(detail.duration_minutes || detail.distance_km || wp) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {detail.duration_minutes && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Time</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{detail.duration_minutes >= 60 ? `${Math.floor(detail.duration_minutes/60)}h ${detail.duration_minutes%60}m` : `~${detail.duration_minutes}min`}</div></div>}
              {detail.distance_km && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Distance</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{detail.distance_km}km</div></div>}
              {wp && <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.bdr}` }}><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Avg pace</div><div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginTop: 2 }}>{fmtPace(wp)}</div></div>}
            </div>
          )}

          {detail.why_text && <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>!</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Coach's message</div></div>
            <div style={{ fontSize: 14, color: C.tl, lineHeight: 1.6 }}>{detail.why_text}</div>
          </div>}

          {(st.warmup || st.main || st.cooldown) && <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
            {st.warmup && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", marginBottom: 3 }}>Warm-up {paces ? `· ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.warmup}</div></div>}
            {st.main && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", marginBottom: 3 }}>Main Set {wp ? `· ${fmtPace(wp)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.main}</div></div>}
            {st.cooldown && <div><div style={{ fontSize: 11, fontWeight: 700, color: C.lb, textTransform: "uppercase", marginBottom: 3 }}>Cool-down {paces ? `· ${fmtPace(paces.easy)}` : ""}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{st.cooldown}</div></div>}
          </div>}

          {hr && <div style={{ background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.bdr}`, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 11, color: C.tlr, fontWeight: 600 }}>Heart Rate Zone {zn}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 2 }}>{hr[0]}–{hr[1]} bpm</div></div>
            <div style={{ fontSize: 11, color: C.tlr }}>Effort: {zn <= 2 ? "3/10" : zn === 3 ? "7/10" : "8/10"}</div>
          </div>}

          {detail.coach_notes && <div style={{ background: `${C.navy}06`, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${C.coral}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>Coach Notes</div>
            <div style={{ fontSize: 12, color: C.tl, lineHeight: 1.5, fontStyle: "italic", marginTop: 2 }}>{detail.coach_notes}</div>
          </div>}

          {!isRest && !done && (
            <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Session check-in</div>
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
                style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.bdr}`, fontSize: 13, resize: "none", height: 80, outline: "none", boxSizing: "border-box", marginBottom: 4, background: C.bg, fontFamily: "inherit" }} />
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
    const isRestDay = !tw || tw.workout_type === "rest";
    const greetHour = today.getHours();
    const greet = greetHour < 12 ? "morning" : greetHour < 17 ? "afternoon" : "evening";

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <PageHeader title="TODAY" streak={comps.length > 0 ? Math.min(comps.length, 30) : 0} onChatTap={handleChatTap} />

        {/* Greeting strip */}
        <div style={{ background: C.lavender, padding: "0 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="#F4C775"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4"/></svg>
            <span style={{ fontSize: 17, fontWeight: 600, color: C.navy }}>Good {greet}, {uname || "Athlete"}</span>
          </div>
          <div style={{ fontSize: 13, color: C.tl, paddingLeft: 32 }}>{isRestDay ? "Rest day today. Recover and bank the recent gains." : (cw?.focus_label || "Keep showing up. Every session matters.")}</div>
        </div>

        {/* TODAY'S FOCUS */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Today's Focus</div>
          {tw && !isRestDay ? (
            <div onClick={() => setDetail(tw)} style={{ background: twMeta.c, borderRadius: 18, padding: 20, cursor: "pointer", color: "#fff" }}>
              <div style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>{tw.description ? tw.description.substring(0, 180) : tw.title}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {twDone ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
                    Completed
                  </div>
                ) : <div style={{ fontSize: 12, opacity: 0.8 }}>Tap to view</div>}
                <div style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "6px 14px", borderRadius: 18 }}>{twMeta.l}</div>
              </div>
              {(tw.duration_minutes || tw.distance_km) && (
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 10 }}>
                  {tw.duration_minutes && `${tw.duration_minutes >= 60 ? Math.floor(tw.duration_minutes/60)+"h "+tw.duration_minutes%60+"m" : tw.duration_minutes+"min"}`}
                  {tw.distance_km && ` · ${tw.distance_km}km`}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: TC.long, borderRadius: 18, padding: 20, color: "#fff" }}>
              <div style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>Today's a rest day. You've earned it. Take it easy, move gently, and give your body the time it needs to recover. Focus on recharging for your next session.</div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "6px 14px", borderRadius: 18 }}>Rest</div>
              </div>
            </div>
          )}
        </div>

        {/* YOUR PROGRESS */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Your Progress</div>
          <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Training metrics ›</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 104, height: 64, flexShrink: 0 }}>
                <svg viewBox="0 0 100 64" style={{ width: "100%" }}>
                  <path d="M 12 54 A 38 38 0 0 1 88 54" fill="none" stroke="#E6EAF3" strokeWidth="8" strokeLinecap="round"/>
                  <path d={`M 12 54 A 38 38 0 0 1 ${12 + (76 * confidence / 100)} ${54 - Math.sin(Math.PI * confidence / 100) * 38}`} fill="none" stroke={C.lb} strokeWidth="8" strokeLinecap="round"/>
                  <text x="50" y="50" textAnchor="middle" fontSize="17" fontWeight="700" fill={C.navy}>{confidence}%</text>
                </svg>
                <div style={{ textAlign: "center", fontSize: 11, color: C.tl, marginTop: -2 }}>Confidence</div>
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { n: "Pace", v: "● On track", c: C.green, pct: 55 },
                  { n: "Volume", v: `${volumePct}%`, c: C.lb, pct: volumePct },
                  { n: "Consistency", v: (confidence / 14).toFixed(1), c: C.green, pct: Math.min(100, confidence) },
                ].map((m, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                      <span style={{ color: C.text }}>{m.n}</span>
                      <span style={{ color: m.c, fontWeight: 600 }}>{m.v}</span>
                    </div>
                    <div style={{ height: 4, background: "#E6EAF3", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: 4, background: m.c, width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat to Coach card */}
        <div style={{ padding: "14px 20px 20px" }}>
          <div onClick={handleChatTap} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 18, padding: 16, cursor: "pointer" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Chat to Coach ›</div>
            <div style={{ background: C.bg, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.1, padding: 4 }}>Coach<br/>Silas</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Coach Silas</div>
                <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>Typically replies in ~3 hours</div>
              </div>
              <div style={{ fontSize: 18, color: C.tlr }}>›</div>
            </div>
          </div>
        </div>

        <NavBar />
        <ChatModal />
      </div>
    );
  }

  // ===== PLAN TAB =====
  if (tab === "plan") {

    // Edit Plan screen
    if (showEditPlan) {
      return (
        <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
          <div style={{ padding: "16px 20px" }}>
            <button onClick={() => setShowEditPlan(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.navy, cursor: "pointer", marginBottom: 6 }}>← PLAN</button>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: 0.5 }}>EDIT PLAN</div>
          </div>

          <div style={{ margin: "10px 20px", background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: 0.5 }}>{athleteProfile?.event_name?.toUpperCase() || plan?.plan_name?.toUpperCase() || "YOUR PLAN"}</div>
              <div style={{ color: C.coral, fontSize: 16 }}>✎</div>
            </div>
            {goalSec && <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.tl }}>⏱ Target time: <span style={{ color: C.navy, fontWeight: 600 }}>{Math.floor(goalSec/3600)}:{String(Math.floor((goalSec%3600)/60)).padStart(2,"0")}:{String(goalSec%60).padStart(2,"0")}</span></div>}
            {paces && <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.tl }}>🏃 Easy run pace: <span style={{ color: C.navy, fontWeight: 600 }}>{fmtPace(paces.easy)}</span></div>}
            {planStart && raceDate && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: C.tl }}>Start date</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 4 }}>{planStart.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: C.tl }}>End date</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 4 }}>{raceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ margin: "14px 20px", background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, letterSpacing: 0.5 }}>TRAINING SCHEDULE</div>
              <div style={{ color: C.coral, fontSize: 16 }}>✎</div>
            </div>
            <div style={{ fontSize: 14, color: C.tl, marginBottom: 6 }}>📅 Run days: <span style={{ color: C.navy, fontWeight: 600 }}>{athleteProfile?.sessions_per_week || 4}</span></div>
            <div style={{ fontSize: 14, color: C.tl, marginBottom: 16 }}>🏋 Strength days: <span style={{ color: C.navy, fontWeight: 600 }}>{athleteProfile?.strength_per_week || 2}</span></div>

            {[
              ["Mon", "Rest day", TC.rest],
              ["Tue", "Hardest run", TC.interval],
              ["Wed", "Strength", TC.strength],
              ["Thu", "Third run", TC.easy],
              ["Fri", "Strength", TC.strength],
              ["Sat", "Fourth run", TC.steady],
              ["Sun", "Longest run", TC.long],
            ].map(([day, label, color], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
                <div style={{ width: 40, fontSize: 14, color: C.tl }}>{day}</div>
                <div style={{ color: C.tlr, fontSize: 12 }}>•</div>
                <div style={{ fontSize: 14, color: C.navy }}>{label}</div>
              </div>
            ))}
          </div>
          <ChatModal />
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <PageHeader title="PLAN" streak={comps.length > 0 ? Math.min(comps.length, 30) : 0} onChatTap={handleChatTap} />

        {/* Sub-tabs */}
        <div style={{ background: C.lavender, padding: "0 20px 0", display: "flex", gap: 28 }}>
          <div onClick={() => setPlanTab("current")} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, paddingBottom: 10, cursor: "pointer", color: planTab === "current" ? C.navy : C.tlr, borderBottom: planTab === "current" ? `2px solid ${C.coral}` : "none" }}>CURRENT</div>
          <div onClick={() => setPlanTab("future")} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, paddingBottom: 10, cursor: "pointer", color: planTab === "future" ? C.navy : C.tlr, borderBottom: planTab === "future" ? `2px solid ${C.coral}` : "none" }}>FUTURE</div>
        </div>

        {planTab === "future" ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>No future plans yet</div>
            <div style={{ fontSize: 13, color: C.tl }}>Your next training plan will appear here.</div>
          </div>
        ) : (
          <div style={{ padding: "18px 0 0" }}>
            {/* Current plan card */}
            {plan && <div style={{ margin: "0 20px 14px", background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}` }}>
              <div style={{ fontSize: 13, color: C.tl }}>Current plan</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, marginTop: 4, letterSpacing: 0.5 }}>{(athleteProfile?.event_name || plan.plan_name || "").toUpperCase()}</div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {goalSec && <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 11, color: C.tl }}>Time</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 2 }}>{Math.floor(goalSec/3600)}:{String(Math.floor((goalSec%3600)/60)).padStart(2,"0")}:{String(goalSec%60).padStart(2,"0")}</div></div>}
                {racePace && <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 11, color: C.tl }}>Pace</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 2 }}>{fmtPace(racePace)}</div></div>}
                {paces && <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 11, color: C.tl }}>Easy pace</div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 2 }}>{fmtPace(paces.easy)}</div></div>}
              </div>

              {planStart && raceDate && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 14, color: C.navy, fontWeight: 600 }}>📅 {planStart.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – {raceDate.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>}

              {raceDate && <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "#E6EAF3" }}>
                <div style={{ height: 6, borderRadius: 3, background: C.green, width: `${Math.max(5, (currentWeekNum / totalWeeks) * 100)}%` }} />
              </div>}

              <div style={{ marginTop: 16 }}><Btn onClick={() => setShowEditPlan(true)}>Edit plan</Btn></div>
            </div>}

            {/* PLAN PHASE */}
            <div style={{ margin: "0 20px 14px", background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}`, cursor: "pointer" }} onClick={() => setShowPhaseModal(true)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, letterSpacing: 1 }}>PLAN PHASE</div>
                <div style={{ fontSize: 20, color: C.navy }}>›</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                {phases.map((p, i) => {
                  const isCurrent = i === currentPhaseIdx;
                  const isCompleted = i < currentPhaseIdx;
                  const ringColor = isCurrent || isCompleted ? C.green : C.bdr;
                  const iconPath = ["✓", "⚡", "⚡", "📊"][i];
                  return (
                    <div key={p.name} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto" }}>
                        <svg width="60" height="60" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="#F4F1F8" stroke={C.bdr} strokeWidth="3"/>
                          {isCompleted && <circle cx="32" cy="32" r="28" fill="none" stroke={C.green} strokeWidth="3"/>}
                          {isCurrent && <circle cx="32" cy="32" r="28" fill="none" stroke={C.green} strokeWidth="3" strokeDasharray={`${Math.min(176, 176 * phaseProgress / 100)} 176`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 32 32)" />}
                        </svg>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 20, color: C.navy }}>{iconPath}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? C.navy : C.tl }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: C.tlr }}>{p.weeks} Weeks</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OVERVIEW */}
            <div style={{ margin: "0 20px 14px", background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, letterSpacing: 1, marginBottom: 4 }}>OVERVIEW</div>
              <div style={{ fontSize: 12, color: C.tl, marginBottom: 14 }}>Week by week mileage of your plan</div>
              {weekMileages.length > 0 && (
                <svg viewBox={`0 0 320 180`} style={{ width: "100%", height: "auto" }}>
                  {weekMileages.slice(0, 6).map((_, i) => (
                    <line key={i} x1={40 + i * 48} y1="20" x2={40 + i * 48} y2="140" stroke="#E6EAF3" strokeWidth="0.5"/>
                  ))}
                  {(() => {
                    const maxKm = Math.max(...weekMileages, 1);
                    const displayWeeks = weekMileages.slice(0, 6);
                    const pts = displayWeeks.map((km, i) => ({ x: 40 + i * 48, y: 110 - (km / maxKm * 70), km: Math.round(km) }));
                    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                    return (
                      <>
                        <path d={pathD} fill="none" stroke={C.lb} strokeWidth="2" strokeLinecap="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <rect x={p.x - 20} y={p.y - 28} width="40" height="18" rx="9" fill="#F4F1F8" />
                            <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="10" fontWeight="600" fill={C.navy}>{p.km}km</text>
                            <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke={C.lb} strokeWidth="2" />
                          </g>
                        ))}
                        {displayWeeks.map((_, i) => {
                          const wk = weeks[i];
                          const dt = wk?.start_date ? new Date(wk.start_date) : null;
                          const label = dt ? `${dt.getDate()} ${dt.toLocaleDateString("en-GB",{month:"short"})}` : `W${i+1}`;
                          return <text key={i} x={40 + i * 48} y="165" textAnchor="middle" fontSize="10" fill={C.tl}>{label}</text>;
                        })}
                      </>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* TYPES OF TRAINING YOU'LL DO */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, letterSpacing: 1, margin: "0 20px 14px" }}>TYPES OF TRAINING YOU'LL DO</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 10px", WebkitOverflowScrolling: "touch" }}>
                {[
                  { name: "Interval runs", color: TC.interval, desc: "Short, sharp bursts with rest in between. Builds your top-end speed and running economy." },
                  { name: "Easy runs", color: TC.easy, desc: "Slow, conversational pace. Builds your aerobic base and helps you recover between hard sessions." },
                  { name: "Tempo runs", color: TC.tempo, desc: "Sustained, comfortably-hard pace. Teaches your body to hold speed longer. Key for race strength." },
                  { name: "Long runs", color: TC.long, desc: "Your weekly endurance session. Builds the stamina and mental toughness to go the distance." },
                  { name: "Steady runs", color: TC.steady, desc: "A notch above easy. Finds your rhythm and builds confidence at a controlled, strong pace." },
                  { name: "Hill repeats", color: TC.hill, desc: "Strength-building intervals up a gradient. Builds power, form and resilience in the legs." },
                ].map((t, i) => (
                  <div key={i} style={{ minWidth: 220, maxWidth: 220, background: t.color, borderRadius: 16, padding: 18, color: "#fff", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t.name}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.95 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plan phase detail modal */}
        {showPhaseModal && (
          <div onClick={() => setShowPhaseModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, maxWidth: 430, margin: "0 auto" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 22px 32px", width: "100%", maxWidth: 430, maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ width: 40, height: 4, background: C.bdr, borderRadius: 2, margin: "0 auto 16px" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 1, marginBottom: 14 }}>PLAN PHASE</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 14 }}>{currentPhase.name}</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {phases.map((p, i) => (
                  <div key={i} style={{ flex: p.weeks, height: 6, borderRadius: 3, background: i < currentPhaseIdx ? C.green : i === currentPhaseIdx ? `${C.green}80` : "#E6EAF3" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.tl, marginBottom: 20 }}>
                {phases.map(p => <span key={p.name} style={{ color: p.name === currentPhase.name ? C.navy : C.tlr, fontWeight: p.name === currentPhase.name ? 600 : 400 }}>{p.name}</span>)}
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.6, fontStyle: "italic" }}>
                  Coach Silas will share the description and 3 key goals for the <strong>{currentPhase.name}</strong> phase soon.
                </div>
              </div>
              <Btn onClick={() => setShowPhaseModal(false)}>Close</Btn>
            </div>
          </div>
        )}

        <NavBar />
        <ChatModal />
      </div>
    );
  }

  // ===== TRAIN TAB =====
  if (tab === "train") {
    const weekStartDate = cw?.start_date ? new Date(cw.start_date) : planStart ? new Date(planStart.getTime() + (currentWeekNum - 1) * 7 * 86400000) : new Date();
    const weekTotalKm = cwk.reduce((s, w) => s + (w.distance_km || 0), 0);
    const weekTotalMin = cwk.reduce((s, w) => s + (w.duration_minutes || 0), 0);
    const weekFocus = cw?.focus_label;

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <PageHeader title="TRAIN" streak={comps.length > 0 ? Math.min(comps.length, 30) : 0} onChatTap={handleChatTap} />

        {/* Week selector row (1..N) */}
        {weeks.length > 1 && (
          <div style={{ background: C.lavender, padding: "6px 20px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Select week</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
              {weeks.map(w => {
                const isSel = w.id === selW;
                const isCurrent = w.week_number === currentWeekNum;
                return (
                  <div key={w.id} onClick={() => setSelW(w.id)} style={{
                    minWidth: 36, height: 36, borderRadius: 10, background: isSel ? C.green : isCurrent ? "#fff" : "#fff",
                    border: `1.5px solid ${isSel ? C.green : isCurrent ? C.green : "#fff"}`, display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                    color: isSel ? "#fff" : isCurrent ? C.green : C.navy, cursor: "pointer", flexShrink: 0,
                  }}>{w.week_number}</div>
                );
              })}
            </div>
          </div>
        )}

        {/* This week's focus box */}
        <div style={{ padding: "14px 20px 10px" }}>
          <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>This week's focus</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {weekFocus ? weekFocus : "Coach Silas will share this week's focus soon."}
            </div>
          </div>
        </div>

        {/* Weekly summary bar */}
        <div style={{ padding: "0 20px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Week {cw?.week_number || 1}</div>
          <div style={{ fontSize: 12, color: C.tl }}>{Math.round(weekTotalKm)}km · {weekTotalMin >= 60 ? `${Math.floor(weekTotalMin/60)}h ${weekTotalMin%60}min` : `${weekTotalMin}min`}</div>
        </div>

        {/* Daily workout list */}
        <div style={{ padding: "8px 0 10px" }}>
          {cwk.map(w => {
            const cat = classifyWorkout(w);
            const color = TC[cat] || TC.easy;
            const isRest = cat === "rest";
            const meta = TM[w.workout_type] || { l: w.title || "Workout" };
            const done = comps.some(c => c.workout_id === w.id);
            const dayDate = weekStartDate ? new Date(weekStartDate.getTime() + (w.day_of_week - 1) * 86400000) : null;
            const isToday = dayDate && dayDate.toDateString() === new Date().toDateString();

            return (
              <div key={w.id} onClick={() => !isRest && setDetail(w)} style={{ display: "flex", alignItems: "stretch", padding: "0 20px", cursor: isRest ? "default" : "pointer" }}>
                <div style={{ width: 52, paddingTop: 14, paddingBottom: 14, textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? C.coral : C.tlr, textTransform: "uppercase" }}>{DN[w.day_of_week]}</div>
                  {dayDate && <div style={{ fontSize: 10, color: isToday ? C.coral : C.tlr }}>{dayDate.getDate()} {dayDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</div>}
                </div>

                <div style={{ width: 4, borderRadius: 2, background: color, margin: "8px 0", flexShrink: 0 }} />

                <div style={{ flex: 1, margin: "8px 0 8px 12px", padding: "12px 14px", borderRadius: 12, background: done ? `${C.green}15` : "#fff", border: `1px solid ${done ? `${C.green}30` : C.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: isRest ? 0.7 : 1 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isRest ? C.tlr : C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title || meta.l}</div>
                    {!isRest && <div style={{ fontSize: 12, color: C.tlr, marginTop: 2 }}>
                      {w.duration_minutes && `~${w.duration_minutes >= 60 ? Math.floor(w.duration_minutes/60)+"h "+w.duration_minutes%60+"m" : w.duration_minutes+"min"}`}
                      {w.distance_km && ` · ${w.distance_km}km`}
                    </div>}
                  </div>
                  {done && <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}><span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span></div>}
                  {!isRest && !done && <div style={{ fontSize: 18, color: C.navy, flexShrink: 0, marginLeft: 8 }}>›</div>}
                </div>
              </div>
            );
          })}
        </div>

        <NavBar />
        <ChatModal />
        {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 13, boxShadow: "0 8px 30px rgba(27,43,90,0.25)", maxWidth: 340, textAlign: "center", zIndex: 20 }}>{toast}</div>}
      </div>
    );
  }

  // ===== PROGRESS TAB =====
  if (tab === "progress") {

    // Weekly report detail screen
    if (showWeeklyReport) {
      const completedThisWeek = cwk.filter(w => comps.some(c => c.workout_id === w.id));
      const completedDistance = Math.round(completedThisWeek.reduce((s, w) => s + (w.distance_km || 0), 0));
      const targetDistance = Math.round(cwk.reduce((s, w) => s + (w.distance_km || 0), 0));
      const sessionCompletion = totalC > 0 ? Math.round(doneC / totalC * 100) : 0;

      // Plan completion
      const planPct = Math.round((currentWeekNum / totalWeeks) * 100);
      const weeksCompleted = Math.max(0, currentWeekNum - 1);

      // Category breakdown
      const cats = ["long", "steady", "easy", "interval", "tempo", "strength"];
      const catLabels = { long: "Long runs", steady: "Steady runs", easy: "Easy runs", interval: "Interval runs", tempo: "Tempo runs", strength: "Strength" };
      const catColors = { long: TC.long, steady: TC.steady, easy: TC.easy, interval: TC.interval, tempo: TC.tempo, strength: TC.strength };
      const catBreakdown = cats.map(c => {
        const cWorkouts = cwk.filter(w => classifyWorkout(w) === c);
        const cDone = cWorkouts.filter(w => comps.some(cp => cp.workout_id === w.id)).length;
        return { cat: c, done: cDone, total: cWorkouts.length };
      }).filter(x => x.total > 0);

      return (
        <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 40 }}>
          <div style={{ background: C.lavender, padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setShowWeeklyReport(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.navy, cursor: "pointer" }}>←</button>
            <div style={{ background: "#fff", border: `1px solid ${C.bdr}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: C.navy }}>WEEK {currentWeekNum} / {totalWeeks} ▾</div>
            <div style={{ width: 22 }} />
          </div>

          <div style={{ padding: "20px 20px 10px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: 0.5 }}>WEEKLY COACH REPORT</div>
          </div>

          {/* Week summary */}
          <div style={{ padding: "14px 20px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 1 }}>WEEK {currentWeekNum} SUMMARY</div>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 18, height: 4, borderRadius: 2, background: C.coral }} />
                <div style={{ width: 18, height: 4, borderRadius: 2, background: C.bdr }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.bdr}` }}>
                <div style={{ position: "relative", width: 60, height: 36, marginBottom: 14 }}>
                  <svg viewBox="0 0 60 36" style={{ width: "100%" }}>
                    <path d="M 6 30 A 24 24 0 0 1 54 30" fill="none" stroke="#E6EAF3" strokeWidth="5" strokeLinecap="round"/>
                    <path d="M 6 30 A 24 24 0 0 1 42 10" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                  <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: C.tlr }}>✓</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{doneC} sessions</div>
                <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>of {totalC} completed</div>
              </div>
              <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.bdr}` }}>
                <div style={{ position: "relative", width: 60, height: 36, marginBottom: 14 }}>
                  <svg viewBox="0 0 60 36" style={{ width: "100%" }}>
                    <path d="M 6 30 A 24 24 0 0 1 54 30" fill="none" stroke="#E6EAF3" strokeWidth="5" strokeLinecap="round"/>
                    <path d="M 6 30 A 24 24 0 0 1 42 10" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{completedDistance}km</div>
                <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>Target: {targetDistance}km</div>
              </div>
            </div>
          </div>

          {/* Progress block */}
          <div style={{ padding: "14px 20px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 1 }}>PROGRESS</div>
              <div style={{ fontSize: 12, color: C.tl }}>End of week {currentWeekNum}</div>
            </div>
            <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.bdr}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 3, height: 44, background: C.green, borderRadius: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{sessionCompletion}%</div>
                  <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>Session completion</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, background: C.lb, borderRadius: 2 }} />
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.tl }}>Total distance</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{completedDistance}km</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 3, height: 16, background: C.navy, borderRadius: 2, borderStyle: "dashed" }} />
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.tl }}>Target distance</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{targetDistance}km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan completion */}
          <div style={{ padding: "14px 20px 10px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 1, marginBottom: 12 }}>PLAN COMPLETION ⓘ</div>
            <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.bdr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 3, background: C.green, borderRadius: 2 }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{weeksCompleted} weeks</div>
                    <div style={{ fontSize: 13, color: C.tl, marginTop: 2 }}>of {totalWeeks} completed</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ background: `${C.green}20`, color: C.green, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{planPct}%</div>
                  <div style={{ fontSize: 12, color: C.tl, marginTop: 6 }}>{daysToRace || 0} days to go</div>
                </div>
              </div>

              {/* Week pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {Array.from({ length: Math.min(12, totalWeeks) }, (_, i) => i + 1).map(n => {
                  const isDone = n < currentWeekNum;
                  const isCurrent = n === currentWeekNum;
                  return (
                    <div key={n} style={{ width: 42, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? C.coral : isDone ? C.green : C.tlr }}>{n}</div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: isDone ? C.coral : isCurrent ? C.green : "#fff", border: `1.5px solid ${isDone ? C.coral : isCurrent ? C.green : C.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>
                        {isDone ? "✓" : isCurrent ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coach's Insight */}
          <div style={{ padding: "14px 20px 20px" }}>
            <div style={{ background: C.card, borderRadius: 14, padding: 18, border: `1.5px solid ${C.lb}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Coach's Insight</div>
                <div style={{ background: C.bg, borderRadius: 14, padding: "4px 10px", fontSize: 11, color: C.tl }}>Last week</div>
              </div>
              <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.55, marginBottom: 16 }}>
                Coach Silas is reviewing your week.
              </div>
              {catBreakdown.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {catBreakdown.map(b => (
                    <div key={b.cat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 90, fontSize: 12, color: C.navy, fontWeight: 600 }}>{catLabels[b.cat]}</div>
                      <div style={{ flex: 1, height: 10, background: C.bg, borderRadius: 5, position: "relative", overflow: "hidden" }}>
                        <div style={{ width: `${b.total > 0 ? (b.done / b.total) * 100 : 0}%`, height: 10, background: catColors[b.cat], borderRadius: 5 }} />
                      </div>
                      <div style={{ width: 44, fontSize: 11, color: C.tl, textAlign: "right" }}>{b.done} of {b.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ChatModal />
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
        <PageHeader title="PROGRESS" streak={comps.length > 0 ? Math.min(comps.length, 30) : 0} onChatTap={handleChatTap} />

        {/* Sub-tabs */}
        <div style={{ background: C.lavender, padding: "0 20px 0", display: "flex", gap: 28 }}>
          <div onClick={() => setProgTab("statistics")} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, paddingBottom: 10, cursor: "pointer", color: progTab === "statistics" ? C.navy : C.tlr, borderBottom: progTab === "statistics" ? `2px solid ${C.coral}` : "none" }}>STATISTICS</div>
          <div onClick={() => setProgTab("achievements")} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, paddingBottom: 10, cursor: "pointer", color: progTab === "achievements" ? C.navy : C.tlr, borderBottom: progTab === "achievements" ? `2px solid ${C.coral}` : "none" }}>ACHIEVEMENTS</div>
        </div>

        {progTab === "achievements" ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Achievements coming soon</div>
            <div style={{ fontSize: 13, color: C.tl }}>Unlock badges as you complete training milestones.</div>
          </div>
        ) : (
          <>
            {/* Goal confidence */}
            <div style={{ padding: "18px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5 }}>Goal Confidence</div>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${C.tlr}`, color: C.tlr, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>i</div>
              </div>
              <div style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.bdr}` }}>
                {goalSec && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 40, background: C.navy, borderRadius: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{String(Math.floor(goalSec/3600)).padStart(2,"0")}:{String(Math.floor((goalSec%3600)/60)).padStart(2,"0")}:{String(goalSec%60).padStart(2,"0")}</div>
                    <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>Your target time</div>
                  </div>
                  <div style={{ color: C.tl, fontSize: 20 }}>⇪</div>
                </div>}
                <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                  <div style={{ position: "relative", width: 180, height: 130 }}>
                    <svg viewBox="0 0 180 130" style={{ width: "100%" }}>
                      <path d="M 20 110 A 70 70 0 1 1 160 110" fill="none" stroke="#EEEAF5" strokeWidth="14" strokeLinecap="round" strokeDasharray="3 5"/>
                      <path d={`M 20 110 A 70 70 0 0 1 ${20 + 140 * confidence / 100} ${110 - Math.sin(Math.PI * confidence / 100) * 70}`} fill="none" stroke={C.lb} strokeWidth="14" strokeLinecap="round"/>
                      <text x="90" y="90" textAnchor="middle" fontSize="34" fontWeight="800" fill={C.navy}>{confidence}%</text>
                      <text x="90" y="110" textAnchor="middle" fontSize="13" fill={C.tl}>Confidence</text>
                    </svg>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <div style={{ display: "inline-block", background: C.bg, borderRadius: 20, padding: "8px 22px", fontSize: 13, fontWeight: 600, color: C.navy }}>Stretch</div>
                </div>
              </div>
            </div>

            {/* Training Metrics */}
            <div style={{ padding: "18px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5 }}>Training Metrics</div>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${C.tlr}`, color: C.tlr, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>i</div>
              </div>
              {[
                { n: "Pace", v: "● On track", c: C.green, pct: 55, desc: "Shows how your completed speed work compares to planned target paces, reflecting how your speed is tracking toward your goal time." },
                { n: "Volume", v: `${volumePct}%`, c: C.lb, pct: volumePct, desc: "Tracks the total distance completed from your planned runs, showing how closely you're meeting your overall training load." },
                { n: "Consistency", v: (confidence / 14).toFixed(1), c: C.green, pct: Math.min(100, confidence), desc: "Reflects how consistently you've completed your planned training over the last four weeks, combining effort and frequency into a single score." }
              ].map((m, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.bdr}`, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: C.tl }}>⌃</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.n}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.c }}>{m.v}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#E6EAF3", marginBottom: 10 }}>
                    <div style={{ height: 6, borderRadius: 3, background: m.c, width: `${m.pct}%` }} />
                  </div>
                  <div style={{ fontSize: 13, color: C.tl, lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Weekly coach report */}
            <div style={{ padding: "18px 20px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.tlr, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Weekly Coach Report</div>
              <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.bdr}` }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.lb}`, borderRadius: 20, padding: "6px 14px", marginBottom: 16 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✓</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Week {currentWeekNum}: Available</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 14, border: `1px solid ${C.bdr}`, textAlign: "left" }}>
                    <svg viewBox="0 0 60 36" style={{ width: 50, marginBottom: 8 }}>
                      <path d="M 6 30 A 24 24 0 0 1 54 30" fill="none" stroke="#E6EAF3" strokeWidth="5" strokeLinecap="round"/>
                      <path d={`M 6 30 A 24 24 0 0 1 ${6 + 48 * (totalC > 0 ? doneC/totalC : 0)} ${30 - Math.sin(Math.PI * (totalC > 0 ? doneC/totalC : 0)) * 24}`} fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round"/>
                    </svg>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>{doneC} sessions</div>
                    <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>of {totalC} completed</div>
                  </div>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 14, padding: 14, border: `1px solid ${C.bdr}`, textAlign: "left" }}>
                    <svg viewBox="0 0 60 36" style={{ width: 50, marginBottom: 8 }}>
                      <path d="M 6 30 A 24 24 0 0 1 54 30" fill="none" stroke="#E6EAF3" strokeWidth="5" strokeLinecap="round"/>
                      <path d="M 6 30 A 24 24 0 0 1 42 10" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round"/>
                    </svg>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C.navy }}>{Math.round(cwk.filter(w => comps.some(c => c.workout_id === w.id)).reduce((s, w) => s + (w.distance_km || 0), 0))}km</div>
                    <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>Target: {Math.round(cwk.reduce((s, w) => s + (w.distance_km || 0), 0))}km</div>
                  </div>
                </div>
                <button onClick={() => setShowWeeklyReport(true)} style={{ width: "100%", background: C.coral, border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
                  View weekly report <span style={{ fontSize: 16 }}>›</span>
                </button>
              </div>
            </div>
          </>
        )}

        <NavBar />
        <ChatModal />
      </div>
    );
  }

  // ===== MORE TAB =====
  if (tab === "more") return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", paddingBottom: 80 }}>
      <PageHeader title="MORE" streak={comps.length > 0 ? Math.min(comps.length, 30) : 0} onChatTap={handleChatTap} />

      <div style={{ padding: "20px" }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bdr}`, textAlign: "center", marginBottom: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.cbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: C.coral, margin: "0 auto 10px" }}>{(uname || "A")[0]}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{uname || "Athlete"}</div>
          <div style={{ fontSize: 13, color: C.tlr, marginTop: 2 }}>{user?.email}</div>
          {athleteProfile && <div style={{ fontSize: 12, color: C.tl, marginTop: 6 }}>{athleteProfile.sport_type} · {athleteProfile.experience_level}{athleteProfile.age ? ` · Age ${athleteProfile.age}` : ""}</div>}
        </div>

        {[
          { icon: "👥", label: "Refer a friend", desc: "Share Kinetic with a fellow athlete" },
          { icon: "🎁", label: "Offers", desc: "Deals and perks for athletes" },
          { icon: "⚙️", label: "Settings", desc: "Account and preferences" },
        ].map((item, i) => (
          <div key={i} onClick={() => showToast("Coming soon")} style={{ background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.bdr}`, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{item.label}</div>
              <div style={{ fontSize: 12, color: C.tl, marginTop: 2 }}>{item.desc}</div>
            </div>
            <div style={{ fontSize: 18, color: C.tlr }}>›</div>
          </div>
        ))}

        <div style={{ marginTop: 24 }}><Btn sec onClick={onLogout}>Log Out</Btn></div>
      </div>
      <NavBar />
      <ChatModal />
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 13, boxShadow: "0 8px 30px rgba(27,43,90,0.25)", maxWidth: 340, textAlign: "center", zIndex: 20 }}>{toast}</div>}
    </div>
  );

  return <div style={{ maxWidth: 430, margin: "0 auto", background: C.bg, minHeight: "100vh", padding: 40, textAlign: "center", color: C.tlr }}>Loading...</div>;
}

// ===== COACH DASHBOARD (unchanged from original) =====
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

  if (view === "athlete" && selA) {
    const aName = selA.profiles?.full_name || selA.profiles?.email || "Athlete";
    const feedbacks = aComps.filter(c => c.athlete_notes);
    const screenshots = aComps.filter(c => c.screenshot_url);
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
          {screenshots.length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 18, marginBottom: 10 }}>Workout Screenshots ({screenshots.length})</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16 }}>
                {screenshots.slice(0, 10).map((c, i) => (
                  <div key={i} style={{ minWidth: 100, height: 130, background: C.card, borderRadius: 10, border: `1px solid ${C.bdr}`, overflow: "hidden", flexShrink: 0 }}>
                    <img src={c.screenshot_url} alt="workout" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 18, marginBottom: 10 }}>Athlete Feedback</div>
          {feedbacks.length > 0 ? feedbacks.slice(-5).reverse().map((c, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}`, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: C.tl, fontStyle: "italic" }}>"{c.athlete_notes}"</div>
            </div>
          )) : <div style={{ fontSize: 13, color: C.tlr, textAlign: "center", padding: 16 }}>No feedback yet.</div>}
        </div>
      </div>
    );
  }

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
          <label style={{ display: "block", background: C.card, borderRadius: 14, padding: 24, border: `2px dashed ${C.bdr}`, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <input type="file" accept=".csv" onChange={handleCsv} style={{ display: "none" }} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Tap to select CSV file</div>
          </label>
          {csvName && <div style={{ background: `${C.green}10`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>✓ {csvName} — {csvRows.length} weeks</div>
          </div>}
          <Btn dis={!csvRows.length} onClick={async () => {
            try {
              const planId = crypto.randomUUID();
              await api.post("training_plans", { id: planId, athlete_id: user.id, coach_id: user.id, plan_name: csvName.replace(".csv", ""), start_date: new Date().toISOString().split("T")[0], status: "active" }, token);
              const dayMap = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7 };
              for (let i = 0; i < csvRows.length; i++) {
                const row = csvRows[i];
                const weekId = crypto.randomUUID();
                const weekNum = i + 1;
                const focus = row.Focus || row.focus || `Week ${weekNum}`;
                await api.post("training_weeks", { id: weekId, plan_id: planId, week_number: weekNum, start_date: new Date(Date.now() + i * 7 * 86400000).toISOString().split("T")[0], focus_label: focus }, token);
                const cols = Object.keys(row).filter(k => k !== "Week" && k !== "week" && k !== "Focus" && k !== "focus");
                for (const col of cols) {
                  if (!row[col] || row[col].trim() === "") continue;
                  const dayName = col.split(" - ")[0].split(" ")[0].trim();
                  const dow = dayMap[dayName] || dayMap[Object.keys(dayMap).find(k => col.toLowerCase().includes(k.toLowerCase()))] || 1;
                  let wtype = "run_easy";
                  const lower = col.toLowerCase() + " " + (row[col] || "").toLowerCase();
                  if (lower.includes("track") || lower.includes("interval")) wtype = "run_intervals";
                  else if (lower.includes("strength")) wtype = "strength";
                  else if (lower.includes("easy")) wtype = "run_easy";
                  else if (lower.includes("mobility")) wtype = "mobility";
                  else if (lower.includes("hill")) wtype = "run_hill";
                  else if (lower.includes("steady")) wtype = "run_steady";
                  else if (lower.includes("tempo")) wtype = "run_tempo";
                  else if (lower.includes("long")) wtype = "run_long";
                  else if (lower.includes("rest")) wtype = "rest";
                  const durMatch = row[col].match(/(\d+)\s*min/);
                  const duration = durMatch ? parseInt(durMatch[1]) : null;
                  await api.post("workouts", { week_id: weekId, day_of_week: dow, workout_type: wtype, title: col.includes(" - ") ? col.split(" - ")[1].trim() : col, description: row[col], why_text: "", duration_minutes: duration, structure: "{}", coach_notes: "" }, token);
                }
              }
              setCsvRows([]); setCsvName(""); setView("roster");
            } catch (e) { console.error(e); }
          }}>Upload Plan to Database</Btn>
        </div>
      </div>
    );
  }

  // ROSTER (unchanged from original)
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const athleteStats = athletes.map(a => {
    const comps = allComps.filter(c => c.athlete_id === a.user_id);
    const recentComps = comps.filter(c => c.created_at ? new Date(c.created_at) > sevenDaysAgo : true);
    const avgRating = comps.filter(c => c.difficulty_rating).length > 0 ? (comps.filter(c => c.difficulty_rating).reduce((s, c) => s + c.difficulty_rating, 0) / comps.filter(c => c.difficulty_rating).length) : null;
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
          <div onClick={() => setView("upload")} style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: `1px solid ${C.bdr}`, cursor: "pointer" }}>
            <div style={{ fontSize: 20 }}>📤</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 2 }}>Upload Plan</div>
          </div>
        </div>
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
          </div>}
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
