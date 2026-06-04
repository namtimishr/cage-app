import React, { useState, useMemo, useEffect } from "react";
import DATA from "./data/countries.json";

// ─── CAGE MARKET ENTRY INTELLIGENCE ───────────────────────────────
// Three axes, kept deliberately separate:
//   OPPORTUNITY (size, wealth, growth, urbanization, digital maturity)
//   DISTANCE    (Cultural, Administrative, Geographic, Economic — CAGE)
//   RISK        (political, regulatory, corruption, currency)
// Hero is the 2x2 prioritization matrix; the composite is a sorting key,
// never the verdict. Real curated data (2024 vintage) with sources.
// Framework: Ghemawat, "Distance Still Matters" (HBR 2001); Redefining
// Global Strategy (2007). See in-app references.
// ──────────────────────────────────────────────────────────────────

const C = DATA.countries;
const CODES = Object.keys(C);
const MAXKM = DATA.meta.maxKm;

function haversine(la1, lo1, la2, lo2) {
  const R = 6371, rad = Math.PI / 180;
  const dp = (la2 - la1) * rad, dl = (lo2 - lo1) * rad;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const DIMS = [
  { key: "cultural", label: "Cultural", short: "C", accent: "#0e6e8c" },
  { key: "admin", label: "Administrative", short: "A", accent: "#2f9e6f" },
  { key: "geographic", label: "Geographic", short: "G", accent: "#3aa6d6" },
  { key: "economic", label: "Economic", short: "E", accent: "#1a8f8a" },
];

const INDUSTRIES = {
  "Software / SaaS":        { d: { cultural: 25, admin: 25, geographic: 5, economic: 45 }, o: { size: 20, wealth: 20, growth: 25, urban: 5, digital: 30 } },
  "Branded consumer goods": { d: { cultural: 40, admin: 20, geographic: 15, economic: 25 }, o: { size: 30, wealth: 20, growth: 20, urban: 20, digital: 10 } },
  "Packaged food & bev":    { d: { cultural: 45, admin: 20, geographic: 20, economic: 15 }, o: { size: 35, wealth: 10, growth: 20, urban: 25, digital: 10 } },
  "Media & entertainment":  { d: { cultural: 50, admin: 20, geographic: 5, economic: 25 }, o: { size: 25, wealth: 20, growth: 20, urban: 10, digital: 25 } },
  "Retail (physical)":      { d: { cultural: 35, admin: 25, geographic: 20, economic: 20 }, o: { size: 30, wealth: 20, growth: 15, urban: 25, digital: 10 } },
  "Industrial machinery":   { d: { cultural: 10, admin: 25, geographic: 35, economic: 30 }, o: { size: 35, wealth: 15, growth: 25, urban: 10, digital: 15 } },
  "Banking & financial":    { d: { cultural: 20, admin: 45, geographic: 5, economic: 30 }, o: { size: 30, wealth: 25, growth: 15, urban: 15, digital: 15 } },
  "Telecom / utilities":    { d: { cultural: 10, admin: 55, geographic: 15, economic: 20 }, o: { size: 35, wealth: 15, growth: 20, urban: 15, digital: 15 } },
  "Cement & heavy mat'l":   { d: { cultural: 5, admin: 20, geographic: 60, economic: 15 }, o: { size: 40, wealth: 5, growth: 25, urban: 20, digital: 10 } },
};

const RISK_W = { political: 30, regulatory: 25, corruption: 25, currency: 20 };

function wsum(obj, w) {
  const tot = Object.values(w).reduce((s, v) => s + v, 0) || 1;
  return Object.keys(w).reduce((s, k) => s + (obj[k] || 0) * w[k], 0) / tot;
}

function profile(homeCode, targetCode, dW, oW) {
  const h = C[homeCode], t = C[targetCode];
  const cultural = (Math.abs(h.dist.lang - t.dist.lang) + Math.abs(h.dist.religion - t.dist.religion) + Math.abs(h.dist.norms - t.dist.norms)) / 3;
  const admin = Math.abs(h.dist.legal - t.dist.legal);
  const km = haversine(h.dist.lat, h.dist.lon, t.dist.lat, t.dist.lon);
  const geographic = Math.min(100, (km / MAXKM) * 100);
  const economic = (Math.abs(h.opp.wealth - t.opp.wealth) + Math.abs(h.opp.digital - t.opp.digital)) / 2;
  const dParts = { cultural, admin, geographic, economic };
  const D = wsum(dParts, dW);
  const O = wsum(t.opp, oW);
  const R = wsum(t.risk, RISK_W);
  return { code: targetCode, country: t, O, D, R, dParts };
}

function attractiveness(p, dWeight, rWeight) {
  return p.O - dWeight * p.D - rWeight * p.R;
}

function distBand(D) {
  if (D < 18) return { label: "Near", tone: "#2f9e6f" };
  if (D < 35) return { label: "Moderate", tone: "#3aa6d6" };
  if (D < 52) return { label: "Far", tone: "#1f6fb0" };
  return { label: "Very far", tone: "#0e3a5e" };
}
function riskBand(R) {
  if (R < 30) return { label: "Low risk", tone: "#2f9e6f" };
  if (R < 50) return { label: "Moderate risk", tone: "#3aa6d6" };
  if (R < 68) return { label: "Elevated risk", tone: "#1f6fb0" };
  return { label: "High risk", tone: "#0e3a5e" };
}

function entryMode(p) {
  const { D, R } = p;
  if (D < 18 && R < 35) return { mode: "Wholly-owned / direct", aaa: "Aggregation",
    why: "Low distance and low risk — your operating model largely ports. Move directly and capture scale.",
    pace: "Move decisively; speed is an advantage." };
  if (D < 35 && R < 50) return { mode: "Greenfield with local leadership", aaa: "Adaptation",
    why: "Navigable friction. Keep control but staff for local nuance and tailor the offer.",
    pace: "Pilot one region, prove the localised model, then scale." };
  if (D < 52 && R < 68) return { mode: "Joint venture or local acquisition", aaa: "Adaptation + Arbitrage",
    why: "High friction — buy the market knowledge you can't build quickly through a partner or target.",
    pace: "Sequence carefully; treat the first market as a learning investment." };
  return { mode: "Light footprint — license / distribute / franchise", aaa: "Arbitrage",
    why: "Severe distance and/or risk. Limit committed capital until the model is proven on the ground.",
    pace: "Stage-gate the investment and be willing to walk away." };
}

function Matrix({ rows, onPick, selected }) {
  const W = 560, H = 440, pad = 54;
  const x = (D) => pad + (1 - D / 100) * (W - 2 * pad);
  const y = (O) => pad + (1 - O / 100) * (H - 2 * pad);
  const quad = [
    { t: "Prioritise", s: "High opportunity · low distance", xa: "right", ya: "top" },
    { t: "Build local capability", s: "High opportunity · high distance", xa: "left", ya: "top" },
    { t: "Opportunistic only", s: "Low opportunity · low distance", xa: "right", ya: "bottom" },
    { t: "Deprioritise", s: "Low opportunity · high distance", xa: "left", ya: "bottom" },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="matrix" role="img" aria-label="Opportunity vs distance matrix">
      <rect x={pad} y={pad} width={(W - 2 * pad) / 2} height={(H - 2 * pad) / 2} fill="#2f9e6f0d" />
      <rect x={W / 2} y={pad} width={(W - 2 * pad) / 2} height={(H - 2 * pad) / 2} fill="#0e6e8c0a" />
      {quad.map((q, i) => {
        const qx = q.xa === "right" ? W - pad - 8 : pad + 8;
        const qy = q.ya === "top" ? pad + 18 : H - pad - 26;
        return <text key={i} x={qx} y={qy} textAnchor={q.xa === "right" ? "end" : "start"} className="qlabel">
          <tspan x={qx} className="qt">{q.t}</tspan>
          <tspan x={qx} dy="14" className="qs">{q.s}</tspan>
        </text>;
      })}
      <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="#c9dae6" strokeWidth="1" strokeDasharray="3 4" />
      <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#c9dae6" strokeWidth="1" strokeDasharray="3 4" />
      <text x={W / 2} y={H - 16} textAnchor="middle" className="axlabel">← more distant                    DISTANCE                    nearer →</text>
      <text x={16} y={H / 2} textAnchor="middle" className="axlabel" transform={`rotate(-90 16 ${H / 2})`}>← lower                    OPPORTUNITY                    higher →</text>
      {rows.map((p, i) => {
        const rb = riskBand(p.R);
        const isSel = selected === p.code;
        return (
          <g key={p.code} style={{ cursor: "pointer", animation: `pop .5s ${i * 0.03}s both` }} onClick={() => onPick(p.code)}>
            <circle cx={x(p.D)} cy={y(p.O)} r={isSel ? 13 : 9} fill={rb.tone} fillOpacity={isSel ? 0.95 : 0.6} stroke="#fff" strokeWidth={isSel ? 2.5 : 1.5} />
            <text x={x(p.D)} y={y(p.O) - (isSel ? 18 : 14)} textAnchor="middle" className="blab" style={{ fontWeight: isSel ? 700 : 500 }}>{p.country.flag} {isSel ? p.country.name : p.code}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function CageMEI() {
  const [home, setHome] = useState("USA");
  const [industry, setIndustry] = useState("Software / SaaS");
  const [shortlist, setShortlist] = useState(["China", "Germany", "India", "UK", "Brazil", "Japan", "Singapore", "Mexico"]);
  const [selected, setSelected] = useState("Germany");
  const [maxRisk, setMaxRisk] = useState(100);
  const [dWeight, setDWeight] = useState(0.6);
  const [rWeight, setRWeight] = useState(0.5);

  const ind = INDUSTRIES[industry];

  const ranked = useMemo(() => CODES.filter((c) => c !== home)
    .map((c) => profile(home, c, ind.d, ind.o))
    .map((p) => ({ ...p, score: attractiveness(p, dWeight, rWeight) }))
    .filter((p) => p.R <= maxRisk)
    .sort((a, z) => z.score - a.score), [home, industry, maxRisk, dWeight, rWeight]);

  const shortRows = useMemo(() => shortlist.filter((c) => c !== home).map((c) => {
    const p = profile(home, c, ind.d, ind.o);
    return { ...p, score: attractiveness(p, dWeight, rWeight) };
  }).sort((a, z) => z.score - a.score), [shortlist, home, industry, dWeight, rWeight]);

  const sel = useMemo(() => (selected && selected !== home ? (() => {
    const p = profile(home, selected, ind.d, ind.o);
    return { ...p, score: attractiveness(p, dWeight, rWeight) };
  })() : null), [selected, home, industry, dWeight, rWeight]);

  function toggleShort(c) { setShortlist((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]); }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Archivo:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;}
    @keyframes rise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes pop{from{opacity:0;transform:scale(.6);}to{opacity:1;transform:scale(1);}}
    .mei{--bg:#ffffff;--panel:#f3f8fb;--line:#d8e6ef;--txt:#0e2a3b;--mut:#52708a;--blue:#1f7a8c;--green:#2f9e6f;
      font-family:'Archivo',system-ui,sans-serif;color:var(--txt);min-height:100%;padding:32px 26px 56px;position:relative;overflow:hidden;
      background:radial-gradient(900px 500px at 84% -12%,#e6f2f6 0%,transparent 60%),radial-gradient(700px 480px at -5% 108%,#e8f4ee 0%,transparent 55%),var(--bg);}
    .mei::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(circle at 50% 50%,#0e2a3b08 1px,transparent 1px);background-size:22px 22px;}
    .wrap{max-width:1180px;margin:0 auto;position:relative;}
    .head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;animation:rise .6s ease both;}
    .ey{font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:var(--blue);font-weight:600;}
    .h1{font-family:'Fraunces',serif;font-weight:500;font-size:clamp(26px,3.6vw,40px);line-height:1.02;margin:8px 0 0;letter-spacing:-.01em;}
    .h1 i{font-style:italic;color:var(--blue);}
    .sub{font-size:13px;color:var(--mut);margin-top:7px;max-width:560px;line-height:1.5;font-weight:300;}
    .ctrls{display:flex;gap:13px;flex-wrap:wrap;margin-top:24px;animation:rise .6s .05s ease both;}
    .field{flex:1;min-width:160px;}
    .lab{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);font-weight:600;margin-bottom:7px;display:block;}
    select{width:100%;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--txt);background:#fff;border:1px solid var(--line);border-radius:8px;appearance:none;cursor:pointer;transition:.2s;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2352708a'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;}
    select:hover{border-color:#b9cfdd;} select:focus{outline:none;border-color:var(--blue);}
    .grid{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;margin-top:26px;align-items:start;}
    @media(max-width:900px){.grid{grid-template-columns:1fr;}}
    .card{background:linear-gradient(180deg,#fff,#f1f8fb);border:1px solid var(--line);border-radius:15px;padding:20px 22px;box-shadow:0 18px 44px -34px #0e2a3b2e;animation:rise .7s .1s ease both;}
    .ctitle{font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin:0 0 3px;}
    .cnote{font-size:11.5px;color:var(--mut);margin-bottom:14px;line-height:1.45;font-weight:300;}
    .matrix{width:100%;height:auto;display:block;}
    .qt{font-size:11.5px;font-weight:700;fill:var(--txt);}.qs{font-size:9px;fill:var(--mut);font-weight:400;}
    .axlabel{font-size:8.5px;letter-spacing:.14em;fill:var(--mut);font-weight:600;text-transform:uppercase;}
    .blab{font-size:9.5px;fill:var(--txt);}
    .rank{display:flex;flex-direction:column;gap:7px;max-height:520px;overflow-y:auto;padding-right:4px;}
    .rrow{display:grid;grid-template-columns:22px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;transition:.16s;animation:rise .4s ease both;}
    .rrow:hover{border-color:#b9cfdd;transform:translateX(2px);}
    .rrow.on{border-color:var(--blue);box-shadow:0 0 0 1px var(--blue);}
    .rk{font-family:'Fraunces',serif;font-size:14px;color:var(--mut);font-weight:600;}
    .rn{font-weight:600;font-size:14px;}
    .rsub{display:flex;gap:8px;margin-top:3px;}
    .pill{font-size:9.5px;padding:2px 7px;border-radius:20px;font-weight:600;letter-spacing:.02em;color:#fff;}
    .rscore{font-family:'Fraunces',serif;font-size:21px;font-weight:600;text-align:right;}
    .rscore small{display:block;font-family:'Archivo';font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);font-weight:600;}
    .axes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px;}
    .axbox{border:1px solid var(--line);border-radius:11px;padding:13px 14px;background:#fff;text-align:center;}
    .axname{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);font-weight:700;}
    .axnum{font-family:'Fraunces',serif;font-size:30px;font-weight:600;line-height:1.1;margin-top:4px;}
    .axband{font-size:10.5px;font-weight:600;margin-top:1px;}
    .selhead{display:flex;align-items:center;gap:10px;}
    .selflag{font-size:26px;}
    .selname{font-family:'Fraunces',serif;font-size:22px;font-weight:600;}
    .bars{margin-top:14px;display:flex;flex-direction:column;gap:9px;}
    .bartop{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;}
    .bartop b{font-family:'Fraunces',serif;}
    .track{height:7px;background:#e3eef4;border-radius:6px;overflow:hidden;}
    .fill{height:100%;border-radius:6px;transition:width .8s cubic-bezier(.2,.7,.2,1);}
    .rec{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:11px;}
    @media(max-width:520px){.rec{grid-template-columns:1fr;}}
    .recbox{border:1px solid var(--line);border-radius:11px;padding:13px 15px;background:linear-gradient(135deg,#f4fafc,#e9f3f6);animation:rise .5s ease both;}
    .reccap{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);font-weight:700;margin-bottom:6px;}
    .recbig{font-family:'Fraunces',serif;font-size:15px;font-weight:600;line-height:1.2;}
    .recbody{font-size:12px;color:var(--mut);line-height:1.5;margin-top:5px;}
    .dom{margin-top:11px;background:linear-gradient(135deg,#eef7f3,#e6f2ee);border:1px solid var(--line);border-radius:11px;padding:13px 15px;display:flex;gap:12px;align-items:center;}
    .dom .ring{width:34px;height:34px;border-radius:50%;flex:none;display:grid;place-items:center;font-family:'Fraunces',serif;font-weight:600;font-size:14px;color:#fff;}
    .dom .t{font-size:12px;color:var(--mut);line-height:1.5;}.dom .t b{color:var(--txt);}
    .filters{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin-top:4px;margin-bottom:12px;}
    .frow{display:flex;flex-direction:column;gap:5px;min-width:150px;flex:1;}
    .frow .ftop{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);}
    input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:4px;background:#cfe0ea;outline:none;cursor:pointer;}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--blue);border:2px solid #fff;box-shadow:0 1px 4px #0003;}
    input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--blue);border:2px solid #fff;}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
    .chip{font-size:11px;padding:6px 11px;border:1px solid var(--line);background:#fff;border-radius:30px;cursor:pointer;color:var(--mut);transition:.15s;font-family:inherit;}
    .chip:hover{border-color:#b9cfdd;color:var(--txt);}
    .chip.on{background:var(--txt);color:#fff;border-color:var(--txt);}
    .foot{margin-top:26px;font-size:10.5px;color:#7d97ab;line-height:1.6;border-top:1px solid var(--line);padding-top:14px;max-width:880px;animation:fadeIn 1s .4s both;}
    .foot b{color:var(--mut);}
  `;

  const selDist = sel ? distBand(sel.D) : null;
  const selRisk = sel ? riskBand(sel.R) : null;
  const selEntry = sel ? entryMode(sel) : null;
  const rawDistTotal = sel ? (sel.dParts.cultural + sel.dParts.admin + sel.dParts.geographic + sel.dParts.economic) : 1;
  const dominant = sel ? [...DIMS].map((d) => ({ d, v: sel.dParts[d.key] })).sort((a, z) => z.v - a.v)[0] : null;

  return (
    <div className="mei">
      <style>{css}</style>
      <div className="wrap">
        <div className="head">
          <div>
            <div className="ey">Market Entry Intelligence Based on CAGE Framework</div>
            <h1 className="h1">Where to expand, and <i>how</i></h1>
            <p className="sub">Opportunity, distance and risk on three separate axes because collapsing them into one number hides the shape of the bet. Real 2024 data; the matrix is the decision, the score only sorts it.</p>
          </div>
        </div>

        <div className="ctrls">
          <div className="field"><span className="lab">Home base</span>
            <select value={home} onChange={(e) => { const v = e.target.value; setHome(v); if (v === selected) setSelected(CODES.find((c) => c !== v)); }}>
              {CODES.map((k) => <option key={k} value={k}>{C[k].flag}  {C[k].name}</option>)}
            </select>
          </div>
          <div className="field"><span className="lab">Industry lens</span>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {Object.keys(INDUSTRIES).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="field"><span className="lab">Selected market</span>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {CODES.filter((c) => c !== home).map((k) => <option key={k} value={k}>{C[k].flag}  {C[k].name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <h3 className="ctitle">Prioritisation matrix</h3>
            <p className="cnote">Opportunity (vertical) against CAGE distance (horizontal); bubble colour = risk. Click any market to inspect it.</p>
            <Matrix rows={shortRows} onPick={setSelected} selected={selected} />

            {sel && (
              <>
                <div className="selhead" style={{ marginTop: 18 }}>
                  <span className="selflag">{sel.country.flag}</span>
                  <span className="selname">{sel.country.name}</span>
                </div>
                <div className="axes" style={{ marginTop: 12 }}>
                  <div className="axbox"><div className="axname">Opportunity</div><div className="axnum" style={{ color: "var(--green)" }}>{sel.O.toFixed(0)}</div><div className="axband" style={{ color: "var(--mut)" }}>higher = better</div></div>
                  <div className="axbox"><div className="axname">Distance</div><div className="axnum" style={{ color: selDist.tone }}>{sel.D.toFixed(0)}</div><div className="axband" style={{ color: selDist.tone }}>{selDist.label}</div></div>
                  <div className="axbox"><div className="axname">Risk</div><div className="axnum" style={{ color: selRisk.tone }}>{sel.R.toFixed(0)}</div><div className="axband" style={{ color: selRisk.tone }}>{selRisk.label}</div></div>
                </div>
                <div className="bars">
                  {DIMS.map((d) => (
                    <div key={d.key}>
                      <div className="bartop"><span style={{ color: "var(--mut)" }}>{d.label} distance</span><b style={{ color: d.accent }}>{sel.dParts[d.key].toFixed(0)}</b></div>
                      <div className="track"><div className="fill" style={{ width: `${Math.min(100, sel.dParts[d.key])}%`, background: d.accent }} /></div>
                    </div>
                  ))}
                </div>
                <div className="rec">
                  <div className="recbox"><div className="reccap">Recommended entry mode</div><div className="recbig">{selEntry.mode}</div><div className="recbody">{selEntry.why}</div></div>
                  <div className="recbox" style={{ animationDelay: ".06s" }}><div className="reccap">AAA strategy · pace</div><div className="recbig">{selEntry.aaa}</div><div className="recbody">{selEntry.pace}</div></div>
                </div>
                {dominant && (
                  <div className="dom">
                    <div className="ring" style={{ background: dominant.d.accent }}>{dominant.d.short}</div>
                    <div className="t">Friction is dominated by <b>{dominant.d.label.toLowerCase()} distance</b> ({(dominant.v / rawDistTotal * 100).toFixed(0)}% of raw distance).{dominant.d.key === "cultural" && " Fund local product fit, language and on-the-ground talent first."}{dominant.d.key === "admin" && " Lead with regulatory, licensing and government-relations work."}{dominant.d.key === "geographic" && " The binding constraint is logistics — model landed cost and lead times."}{dominant.d.key === "economic" && " Re-engineer the offer for local income and infrastructure."}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card" style={{ animationDelay: ".15s" }}>
            <h3 className="ctitle">Market screen</h3>
            <p className="cnote">All {CODES.length - 1} markets ranked by strategic attractiveness from {C[home].name} for {industry}. Attractiveness sorts; it never decides. Tap to inspect and add to the matrix.</p>
            <div className="filters">
              <div className="frow"><div className="ftop"><span>Max risk</span><b>{maxRisk}</b></div><input type="range" min="20" max="100" value={maxRisk} onChange={(e) => setMaxRisk(+e.target.value)} /></div>
              <div className="frow"><div className="ftop"><span>Distance penalty</span><b>{dWeight.toFixed(1)}</b></div><input type="range" min="0" max="1.5" step="0.1" value={dWeight} onChange={(e) => setDWeight(+e.target.value)} /></div>
              <div className="frow"><div className="ftop"><span>Risk penalty</span><b>{rWeight.toFixed(1)}</b></div><input type="range" min="0" max="1.5" step="0.1" value={rWeight} onChange={(e) => setRWeight(+e.target.value)} /></div>
            </div>
            <div className="rank">
              {ranked.map((p, i) => {
                const db = distBand(p.D), rb = riskBand(p.R);
                return (
                  <div key={p.code} className={"rrow" + (selected === p.code ? " on" : "")} style={{ animationDelay: `${i * 0.015}s` }} onClick={() => { setSelected(p.code); if (!shortlist.includes(p.code)) toggleShort(p.code); }}>
                    <div className="rk">{i + 1}</div>
                    <div>
                      <div className="rn">{p.country.flag} {p.country.name}</div>
                      <div className="rsub">
                        <span className="pill" style={{ background: "var(--green)" }}>O {p.O.toFixed(0)}</span>
                        <span className="pill" style={{ background: db.tone }}>D {p.D.toFixed(0)}</span>
                        <span className="pill" style={{ background: rb.tone }}>R {p.R.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="rscore">{p.score.toFixed(0)}<small>score</small></div>
                  </div>
                );
              })}
            </div>
            <div className="chips">
              {shortlist.filter((c) => c !== home).map((c) => (
                <button key={c} className="chip on" onClick={() => toggleShort(c)}>{C[c].flag} {C[c].name} ✕</button>
              ))}
            </div>
          </div>
        </div>

        <div className="foot">
          <b>Method.</b> Opportunity = industry-weighted blend of market size, wealth, growth, urbanisation and digital maturity (higher = better). Distance = industry-weighted CAGE (Cultural, Administrative, Geographic, Economic), home-relative. Risk = political stability, regulatory quality, corruption and currency volatility (higher = more risk). Strategic attractiveness = Opportunity − (distance penalty × Distance) − (risk penalty × Risk); it is a sorting key, shown alongside its components, never a standalone verdict. Entry-mode guidance is deterministic and rule-based so every recommendation is auditable.
          &nbsp;<b>Data.</b> Curated 2024 snapshot from IMF WEO (Oct 2024), World Bank WDI &amp; Worldwide Governance Indicators (2023), Transparency International CPI (2024), and CEPII-style geographic/structural attributes. Figures are real and dated but hand-keyed for demonstration — verify against source before any live decision; replace via ETL for a live feed.
          &nbsp;<b>References.</b> Pankaj Ghemawat, "Distance Still Matters: The Hard Reality of Global Expansion," Harvard Business Review (2001); Redefining Global Strategy (Harvard Business School Press, 2007).
          <br /><br />
          Built by <a href="https://www.linkedin.com/in/namitmishr/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>Namit Mishra</a>
        </div>
      </div>
    </div>
  );
}
