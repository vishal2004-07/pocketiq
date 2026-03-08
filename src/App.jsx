import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Error Boundary ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff8f0", fontFamily:"sans-serif" }}>
        <div style={{ background:"#fff", border:"2px solid #fed7aa", borderRadius:16, padding:"32px 36px", maxWidth:460, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <div style={{ fontWeight:700, fontSize:18, color:"#9a3412", marginBottom:8 }}>Something went wrong</div>
          <div style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>{this.state.err.message}</div>
          <button onClick={() => this.setState({ err: null })} style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontWeight:700, cursor:"pointer", fontSize:14 }}>Try Again</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────
const uid    = () => Math.random().toString(36).slice(2, 10);
const today  = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
const dayOff = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// ─── Constants ───────────────────────────────────────────────────
const TAGS = ["Food","Transport","Shopping","Housing","Health","Entertainment","Education","Travel","Utilities","Other"];
const TAG_ICON  = { Food:"🍽️", Transport:"🚗", Shopping:"🛍️", Housing:"🏠", Health:"❤️", Entertainment:"🎬", Education:"📚", Travel:"✈️", Utilities:"⚡", Other:"📌" };
const TAG_COLOR = { Food:"#f97316", Transport:"#06b6d4", Shopping:"#a855f7", Housing:"#64748b", Health:"#ef4444", Entertainment:"#ec4899", Education:"#3b82f6", Travel:"#10b981", Utilities:"#f59e0b", Other:"#6b7280" };
const CURRENCIES = [
  { code:"USD", sym:"$",   rate:1     }, { code:"EUR", sym:"€",   rate:0.92  },
  { code:"GBP", sym:"£",   rate:0.79  }, { code:"INR", sym:"₹",   rate:83.1  },
  { code:"JPY", sym:"¥",   rate:149.5 }, { code:"CAD", sym:"C$",  rate:1.36  },
  { code:"AUD", sym:"A$",  rate:1.53  }, { code:"AED", sym:"د.إ", rate:3.67  },
  { code:"SGD", sym:"S$",  rate:1.34  },
];
const getCur  = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
const fmtAmt  = (usd, code) => { const c = getCur(code); return `${c.sym}${(usd * c.rate).toFixed(2)}`; };

// ─── Demo data ───────────────────────────────────────────────────
const DEMO = [
  { id:uid(), title:"Weekly groceries",  tag:"Food",          amount:87.4,  date:dayOff(-1),  method:"card",     note:"Whole Foods" },
  { id:uid(), title:"Monthly rent",      tag:"Housing",       amount:1400,  date:dayOff(-2),  method:"transfer", note:"" },
  { id:uid(), title:"Spotify Premium",   tag:"Entertainment", amount:9.99,  date:dayOff(-3),  method:"card",     note:"" },
  { id:uid(), title:"Uber ride",         tag:"Transport",     amount:14.5,  date:dayOff(-4),  method:"card",     note:"Airport" },
  { id:uid(), title:"Coffee and pastry", tag:"Food",          amount:8.75,  date:dayOff(-5),  method:"cash",     note:"Blue Bottle" },
  { id:uid(), title:"Gym membership",    tag:"Health",        amount:45,    date:dayOff(-6),  method:"card",     note:"Monthly" },
  { id:uid(), title:"Python course",     tag:"Education",     amount:29.99, date:dayOff(-8),  method:"card",     note:"Udemy" },
  { id:uid(), title:"Electric bill",     tag:"Utilities",     amount:62.3,  date:dayOff(-9),  method:"transfer", note:"" },
  { id:uid(), title:"Thai takeout",      tag:"Food",          amount:22.5,  date:dayOff(-10), method:"cash",     note:"" },
  { id:uid(), title:"New sneakers",      tag:"Shopping",      amount:110,   date:dayOff(-12), method:"card",     note:"Nike outlet" },
  { id:uid(), title:"Doctor visit",      tag:"Health",        amount:35,    date:dayOff(-14), method:"card",     note:"Copay" },
  { id:uid(), title:"Flight to NYC",     tag:"Travel",        amount:189,   date:dayOff(-15), method:"card",     note:"Round trip" },
  { id:uid(), title:"Weekly groceries",  tag:"Food",          amount:91.2,  date:dayOff(-16), method:"card",     note:"" },
  { id:uid(), title:"Netflix",           tag:"Entertainment", amount:15.99, date:dayOff(-17), method:"card",     note:"" },
  { id:uid(), title:"Bus pass",          tag:"Transport",     amount:30,    date:dayOff(-18), method:"cash",     note:"Monthly" },
  { id:uid(), title:"Monthly rent",      tag:"Housing",       amount:1400,  date:dayOff(-32), method:"transfer", note:"" },
  { id:uid(), title:"Spotify Premium",   tag:"Entertainment", amount:9.99,  date:dayOff(-33), method:"card",     note:"" },
  { id:uid(), title:"Gym membership",    tag:"Health",        amount:45,    date:dayOff(-36), method:"card",     note:"Monthly" },
  { id:uid(), title:"Internet bill",     tag:"Utilities",     amount:58,    date:dayOff(-38), method:"transfer", note:"" },
  { id:uid(), title:"Sushi dinner",      tag:"Food",          amount:67,    date:dayOff(-40), method:"card",     note:"" },
];

// ─── Storage ─────────────────────────────────────────────────────
const store = {
  async get(k) {
    try { const r = await window.storage.get(k); return r ? r.value : null; }
    catch { return localStorage.getItem("piq_" + k); }
  },
  async set(k, v) {
    try { await window.storage.set(k, v); }
    catch { localStorage.setItem("piq_" + k, v); }
  },
};

// ─── Pure helpers ─────────────────────────────────────────────────
function detectRecurring(entries) {
  const groups = {};
  entries.forEach(e => { const k = e.title.toLowerCase().trim(); groups[k] = [...(groups[k]||[]), e]; });
  return Object.entries(groups).filter(([,l]) => l.length >= 2).map(([,list]) => {
    const sorted = [...list].sort((a,b) => new Date(a.date)-new Date(b.date));
    const gaps   = sorted.slice(1).map((e,i) => (new Date(e.date)-new Date(sorted[i].date))/86400000);
    const avg    = gaps.reduce((a,b)=>a+b,0)/gaps.length;
    return { title:sorted[0].title, tag:sorted[0].tag, count:list.length, avgAmt:list.reduce((s,e)=>s+e.amount,0)/list.length, freq:avg<=9?"Weekly":avg<=35?"Monthly":"Periodic" };
  });
}

// ─── Small shared UI ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", flex:1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:17 }}>{icon}</span>
        <span style={{ fontSize:10, color:"#94a3b8", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{label}</span>
      </div>
      <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e" }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"#94a3b8", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [key,  setKey]  = useState("");
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#fff8f0,#ffefd5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"44px 40px", width:420, boxShadow:"0 8px 40px #0000001a" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:42, marginBottom:8 }}>💰</div>
          <div style={{ fontWeight:700, fontSize:28, color:"#1a1a2e" }}>Pocket<span style={{ color:"#f97316" }}>IQ</span></div>
          <div style={{ color:"#94a3b8", fontSize:13, marginTop:4 }}>Smart spending, smarter decisions</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:5 }}>Your name</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" onKeyDown={e=>e.key==="Enter"&&name.trim()&&onLogin(name.trim(),key.trim(),false)}
            style={{ width:"100%", border:"2px solid #f0ece6", borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none" }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:5 }}>
            Groq API Key <span style={{ fontWeight:400, color:"#94a3b8" }}>(free at console.groq.com)</span>
          </div>
          <input value={key} onChange={e=>setKey(e.target.value)} placeholder="gsk_..." type="password"
            style={{ width:"100%", border:"2px solid #f0ece6", borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none" }} />
        </div>
        <button onClick={()=>name.trim()&&onLogin(name.trim(),key.trim(),false)}
          style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:12, padding:"12px 0", fontWeight:700, fontSize:16, cursor:"pointer", boxShadow:"0 4px 16px #f9731640" }}>
          Get Started
        </button>
        <div style={{ textAlign:"center", marginTop:14 }}>
          <span onClick={()=>onLogin("Demo User","",true)}
            style={{ color:"#f97316", fontSize:13, cursor:"pointer", fontWeight:700 }}>
            ▶ Try with demo data
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Modal ─────────────────────────────────────────────────
function EntryModal({ initial, onSave, onClose }) {
  const blank = { id:uid(), title:"", tag:"Food", amount:"", date:today(), method:"card", note:"" };
  const [form, setForm] = useState(initial ? { ...initial, amount:String(initial.amount) } : blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = () => {
    if (!form.title.trim()||!form.amount) { alert("Title and amount are required."); return; }
    onSave({ ...form, amount:parseFloat(form.amount) });
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000066", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:"28px 30px", width:480, boxShadow:"0 16px 60px #00000033", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontWeight:700, fontSize:18, color:"#1a1a2e", marginBottom:20 }}>{initial?.id ? "Edit Entry" : "New Entry"}</div>
        {[{l:"Title",key:"title",t:"text",ph:"e.g. Grocery run"},{l:"Amount (USD)",key:"amount",t:"number",ph:"0.00"},{l:"Date",key:"date",t:"date",ph:""},{l:"Note",key:"note",t:"text",ph:"Optional"}].map(f=>(
          <div key={f.key} style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:5 }}>{f.l}</div>
            <input type={f.t} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph}
              style={{ width:"100%", border:"2px solid #f0ece6", borderRadius:10, padding:"9px 13px", fontSize:14, outline:"none" }} />
          </div>
        ))}
        <div style={{ display:"flex", gap:12, marginBottom:18 }}>
          {[{l:"Tag",key:"tag",opts:TAGS},{l:"Method",key:"method",opts:["card","cash","transfer","other"]}].map(f=>(
            <div key={f.key} style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:5 }}>{f.l}</div>
              <select value={form[f.key]} onChange={e=>set(f.key,e.target.value)} style={{ width:"100%", border:"2px solid #f0ece6", borderRadius:10, padding:"9px 12px", fontSize:14, background:"#fff" }}>
                {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={submit} style={{ flex:1, background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:12, padding:"11px 0", fontWeight:700, fontSize:15, cursor:"pointer" }}>
            {initial?.id ? "Update Entry" : "Add Entry"}
          </button>
          <button onClick={onClose} style={{ background:"#f8f5f1", color:"#64748b", border:"none", borderRadius:12, padding:"11px 18px", cursor:"pointer", fontSize:14, fontWeight:600 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Scanner ──────────────────────────────────────────────
function ReceiptScanner({ apiKey, onResult, onClose }) {
  const [status, setStatus] = useState("idle");
  const scan = async (file) => {
    if (!apiKey) { alert("An API key is required for receipt scanning."); return; }
    setStatus("scanning");
    try {
      const b64 = await new Promise(res => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.readAsDataURL(file); });
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:300, messages:[{ role:"user", content:[
          { type:"image", source:{ type:"base64", media_type:file.type, data:b64 } },
          { type:"text",  text:`Read this receipt. Reply ONLY in JSON, no markdown: {"amount":0,"title":"","tag":"Food","date":null}. Tag must be one of: ${TAGS.join(",")}` }
        ]}]}),
      });
      const data = await res.json();
      const p = JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim());
      onResult({ id:uid(), title:p.title||"Receipt", tag:p.tag||"Other", amount:p.amount||0, date:p.date||today(), method:"card", note:"Scanned" });
    } catch { setStatus("error"); }
  };
  return (
    <div style={{ background:"#fff7ed", border:"2px dashed #f97316", borderRadius:14, padding:24, marginBottom:16, textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
      <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:8 }}>
        {status==="idle" ? "Upload a receipt photo" : status==="scanning" ? "Reading receipt…" : "⚠️ Failed — try a clearer photo"}
      </div>
      <input type="file" accept="image/*" onChange={e=>e.target.files[0]&&scan(e.target.files[0])} style={{ display:"block", margin:"0 auto 10px" }} />
      <button onClick={onClose} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:13 }}>Cancel</button>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────
function OverviewTab({ entries, currency }) {
  const now          = new Date();
  const thisKey      = now.toISOString().slice(0,7);
  const lastKey      = new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,7);
  const tmE          = entries.filter(e=>e.date.startsWith(thisKey));
  const lmE          = entries.filter(e=>e.date.startsWith(lastKey));
  const tmTotal      = tmE.reduce((s,e)=>s+e.amount,0);
  const lmTotal      = lmE.reduce((s,e)=>s+e.amount,0);
  const diff         = tmTotal - lmTotal;
  const recurring    = detectRecurring(entries);

  const sparkData = Array.from({length:14},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(13-i));
    const k=d.toISOString().slice(0,10);
    return { day:d.getDate(), amt:entries.filter(e=>e.date===k).reduce((s,e)=>s+e.amount,0) };
  });

  const byTag = {};
  tmE.forEach(e=>{ byTag[e.tag]=(byTag[e.tag]||0)+e.amount; });
  const topTags = Object.entries(byTag).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div>
      <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", marginBottom:18 }}>
        Overview <span style={{ fontSize:13, fontWeight:400, color:"#94a3b8" }}>{now.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard icon="📊" label="This Month"  value={fmtAmt(tmTotal,currency)} sub={`${tmE.length} entries`} />
        <StatCard icon="📅" label="Last Month"  value={fmtAmt(lmTotal,currency)} sub="Previous period" />
        <StatCard icon={diff>0?"📈":"📉"} label="Change"  value={(diff>0?"+":"")+fmtAmt(Math.abs(diff),currency)} sub={diff>0?"More than last month":"Less than last month"} />
        <StatCard icon="📌" label="All Entries" value={entries.length} sub="Total" />
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", marginBottom:16 }}>
        <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:12, fontSize:14 }}>Daily Spending — Last 14 Days</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={sparkData}>
            <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.18}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="day" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,"Spent"]}/>
            <Area type="monotone" dataKey="amt" stroke="#f97316" strokeWidth={2} fill="url(#og)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:"flex", gap:14 }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", flex:1 }}>
          <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:12, fontSize:14 }}>Top Categories This Month</div>
          {topTags.length===0 && <div style={{ color:"#94a3b8", fontSize:13 }}>No entries this month yet.</div>}
          {topTags.map(([tag,amt])=>{
            const pct = tmTotal>0?(amt/tmTotal)*100:0;
            return (
              <div key={tag} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:3 }}>
                  <span style={{ color:"#475569", fontWeight:600 }}>{TAG_ICON[tag]} {tag}</span>
                  <span style={{ color:"#1a1a2e", fontWeight:700 }}>{fmtAmt(amt,currency)}</span>
                </div>
                <div style={{ height:6, background:"#f0ece6", borderRadius:6, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:TAG_COLOR[tag]||"#f97316", borderRadius:6 }}/>
                </div>
              </div>
            );
          })}
        </div>
        {recurring.length>0 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", flex:1 }}>
            <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:12, fontSize:14 }}>🔄 Recurring Detected</div>
            {recurring.slice(0,5).map(r=>(
              <div key={r.title} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #f8f5f1" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{r.title}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{r.freq} · {r.count}×</div>
                </div>
                <span style={{ background:"#fff3e0", color:"#f97316", borderRadius:8, padding:"2px 10px", fontSize:12, fontWeight:700 }}>{fmtAmt(r.avgAmt,currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Entries Tab ─────────────────────────────────────────────────
function EntriesTab({ entries, currency, filter, setFilter, onEdit, onDelete, onAddScanned, exportCSV, exportPDF, apiKey }) {
  const [scanOpen, setScanOpen] = useState(false);
  const visible = entries.filter(e=>(filter.tag==="All"||e.tag===filter.tag)&&(!filter.search||e.title.toLowerCase().includes(filter.search.toLowerCase())));
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", flex:1 }}>Entries</div>
        <button onClick={()=>setScanOpen(s=>!s)} style={{ background:"#fff", border:"1px solid #f0ece6", borderRadius:10, padding:"7px 13px", fontSize:13, color:"#475569", cursor:"pointer", fontWeight:600 }}>📷 Scan</button>
        <button onClick={exportCSV}               style={{ background:"#fff", border:"1px solid #f0ece6", borderRadius:10, padding:"7px 13px", fontSize:13, color:"#475569", cursor:"pointer", fontWeight:600 }}>↓ CSV</button>
        <button onClick={exportPDF}               style={{ background:"#fff", border:"1px solid #f0ece6", borderRadius:10, padding:"7px 13px", fontSize:13, color:"#475569", cursor:"pointer", fontWeight:600 }}>↓ PDF</button>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} placeholder="Search…"
          style={{ border:"1px solid #f0ece6", borderRadius:10, padding:"8px 14px", fontSize:13, outline:"none", width:200 }}/>
        <select value={filter.tag} onChange={e=>setFilter(f=>({...f,tag:e.target.value}))}
          style={{ border:"1px solid #f0ece6", borderRadius:10, padding:"8px 12px", fontSize:13, background:"#fff", cursor:"pointer" }}>
          <option value="All">All Tags</option>
          {TAGS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize:13, color:"#94a3b8", alignSelf:"center" }}>{visible.length} entries · {fmtAmt(visible.reduce((s,e)=>s+e.amount,0),currency)}</span>
      </div>
      {scanOpen && <ReceiptScanner apiKey={apiKey} onResult={d=>{setScanOpen(false);onAddScanned(d);}} onClose={()=>setScanOpen(false)}/>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {visible.length===0 && <div style={{ textAlign:"center", color:"#94a3b8", padding:48 }}>No entries found.</div>}
        {visible.map(e=>(
          <div key={e.id} style={{ background:"#fff", borderRadius:14, padding:"13px 18px", border:"1px solid #f0ece6", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:(TAG_COLOR[e.tag]||"#94a3b8")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{TAG_ICON[e.tag]||"📌"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, color:"#1a1a2e", fontSize:14 }}>{e.title}</div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{fmtDate(e.date)} · {e.tag}{e.note?" · "+e.note:""}</div>
            </div>
            <div style={{ fontWeight:700, fontSize:15, color:"#1a1a2e", flexShrink:0 }}>{fmtAmt(e.amount,currency)}</div>
            <button onClick={()=>onEdit(e)} style={{ background:"#f8f5f1", border:"none", borderRadius:8, padding:"5px 10px", cursor:"pointer" }}>✏️</button>
            <button onClick={()=>onDelete(e.id)} style={{ background:"#fff0f0", border:"none", borderRadius:8, padding:"5px 10px", cursor:"pointer" }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────
function AnalyticsTab({ entries, currency }) {
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const k=d.toISOString().slice(0,7);
    return { label:d.toLocaleDateString("en-US",{month:"short"}), total:entries.filter(e=>e.date.startsWith(k)).reduce((s,e)=>s+e.amount,0) };
  });
  const pieData = TAGS.map(t=>({ name:t, value:entries.filter(e=>e.tag===t).reduce((s,e)=>s+e.amount,0) })).filter(d=>d.value>0);
  return (
    <div>
      <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", marginBottom:18 }}>Analytics</div>
      <div style={{ display:"flex", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", flex:2 }}>
          <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:14, fontSize:14 }}>Monthly Spending — 6 Months</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={months} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,"Spent"]}/>
              <Bar dataKey="total" fill="#f97316" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:"1px solid #f0ece6", width:280 }}>
          <div style={{ fontWeight:700, color:"#1a1a2e", marginBottom:14, fontSize:14 }}>By Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={76} dataKey="value" paddingAngle={2}>
                {pieData.map(d=><Cell key={d.name} fill={TAG_COLOR[d.name]||"#94a3b8"}/>)}
              </Pie>
              <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
            {pieData.slice(0,6).map(d=>(
              <div key={d.name} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#475569" }}>
                <div style={{ width:8, height:8, borderRadius:2, background:TAG_COLOR[d.name]||"#94a3b8" }}/>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Wallets Tab ─────────────────────────────────────────────────
function WalletsTab({ wallets, monthEntries, currency, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ name:"", tag:"Food", limitUsd:"200" });
  const addWallet = () => {
    if (!form.name.trim()) return;
    onUpdate([...wallets, { id:uid(), name:form.name, tag:form.tag, limitUsd:parseFloat(form.limitUsd)||200 }]);
    setAdding(false); setForm({ name:"", tag:"Food", limitUsd:"200" });
  };
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", flex:1 }}>Wallets</div>
        <button onClick={()=>setAdding(a=>!a)} style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:10, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ New Wallet</button>
      </div>
      {adding && (
        <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid #f0ece6", marginBottom:14, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <input placeholder="Wallet name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ border:"1px solid #f0ece6", borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none", width:190 }}/>
          <select value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))} style={{ border:"1px solid #f0ece6", borderRadius:8, padding:"7px 10px", fontSize:13, background:"#fff" }}>
            {TAGS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Limit ($)" value={form.limitUsd} onChange={e=>setForm(f=>({...f,limitUsd:e.target.value}))} style={{ border:"1px solid #f0ece6", borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none", width:130 }}/>
          <button onClick={addWallet} style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontWeight:700, fontSize:13 }}>Add</button>
          <button onClick={()=>setAdding(false)} style={{ background:"#f8f5f1", border:"none", borderRadius:8, padding:"7px 12px", cursor:"pointer", fontSize:13 }}>Cancel</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {wallets.map(w=>{
          const spent = monthEntries.filter(e=>e.tag===w.tag).reduce((s,e)=>s+e.amount,0);
          const pct   = Math.min(100,(spent/w.limitUsd)*100);
          const over  = pct>=100;
          return (
            <div key={w.id} style={{ background:"#fff", borderRadius:16, padding:"18px 20px", border:over?"2px solid #fca5a5":"1px solid #f0ece6" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, color:"#1a1a2e" }}>{w.name}</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>{w.tag}</div>
                </div>
                <button onClick={()=>onUpdate(wallets.filter(x=>x.id!==w.id))} style={{ background:"none", border:"none", cursor:"pointer", color:"#cbd5e1", fontSize:18, lineHeight:1 }}>×</button>
              </div>
              <div style={{ fontWeight:700, fontSize:20, color:over?"#ef4444":"#1a1a2e", marginBottom:8 }}>
                {fmtAmt(spent,currency)} <span style={{ fontSize:13, color:"#94a3b8", fontWeight:400 }}>/ {fmtAmt(w.limitUsd,currency)}</span>
              </div>
              <div style={{ height:8, background:"#f0ece6", borderRadius:8, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:over?"#ef4444":pct>75?"#f59e0b":"#10b981", borderRadius:8 }}/>
              </div>
              <div style={{ fontSize:11, color:over?"#ef4444":"#94a3b8", marginTop:5 }}>
                {over?`⚠️ Over by ${fmtAmt(spent-w.limitUsd,currency)}`:`${fmtAmt(w.limitUsd-spent,currency)} remaining`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Panel ──────────────────────────────────────────────────
function ChatPanel({ entries, currency, apiKey, onMutate, onClose }) {
  const [msgs,  setMsgs]  = useState([]);
  const [input, setInput] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [rec,   setRec]   = useState(false);
  const eRef = useRef(entries);
  useEffect(()=>{ eRef.current=entries; },[entries]);

  const TIPS = ["I spent $30 on lunch today","Show this month total","What's my top category?","Delete last entry"];
  const tools = [
    { name:"add_entry",    description:"Add spending entry",    input_schema:{ type:"object", properties:{ title:{type:"string"}, tag:{type:"string",enum:TAGS}, amount:{type:"number"}, date:{type:"string"}, method:{type:"string",enum:["card","cash","transfer","other"]}, note:{type:"string"} }, required:["title","tag","amount"] } },
    { name:"get_entries",  description:"Get entries",           input_schema:{ type:"object", properties:{ period:{type:"string",enum:["today","this_week","this_month","last_month","all"]}, tag:{type:"string"}, limit:{type:"number"} } } },
    { name:"delete_entry", description:"Delete entry",          input_schema:{ type:"object", properties:{ selector:{type:"string",enum:["last_added"]}, id:{type:"string"} } } },
    { name:"get_summary",  description:"Get spending summary",  input_schema:{ type:"object", properties:{ type:{type:"string",enum:["overview","by_tag","recurring"]} }, required:["type"] } },
  ];
  const runTool = (name, inp) => {
    const all = eRef.current; const now = new Date();
    if (name==="add_entry") { const e={id:uid(),title:inp.title,tag:inp.tag,amount:inp.amount,date:inp.date||today(),method:inp.method||"card",note:inp.note||""}; onMutate("add",e); return {ok:true,entry:e}; }
    if (name==="get_entries") {
      let r=[...all];
      if (inp.period==="today") r=r.filter(e=>e.date===today());
      else if (inp.period==="this_week") { const s=new Date(); s.setDate(s.getDate()-7); r=r.filter(e=>new Date(e.date)>=s); }
      else if (inp.period==="this_month") r=r.filter(e=>e.date.startsWith(now.toISOString().slice(0,7)));
      else if (inp.period==="last_month") { const lm=new Date(now.getFullYear(),now.getMonth()-1,1); r=r.filter(e=>e.date.startsWith(lm.toISOString().slice(0,7))); }
      if (inp.tag) r=r.filter(e=>e.tag===inp.tag);
      return r.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,inp.limit||20);
    }
    if (name==="delete_entry") { const t=inp.selector==="last_added"?all[0]:all.find(e=>e.id===inp.id); if(!t) return {error:"Not found"}; onMutate("delete",t); return {ok:true,deleted:t.title}; }
    if (name==="get_summary") {
      const tm=all.filter(e=>e.date.startsWith(now.toISOString().slice(0,7)));
      if (inp.type==="overview") return { thisMonth:tm.reduce((s,e)=>s+e.amount,0), count:tm.length, allTime:all.length };
      if (inp.type==="by_tag")   return TAGS.map(t=>({ tag:t, total:tm.filter(e=>e.tag===t).reduce((s,e)=>s+e.amount,0) })).filter(x=>x.total>0);
      if (inp.type==="recurring") return detectRecurring(all);
    }
  };

  const send = async (text) => {
    if (!text.trim()||busy) return;
    if (!apiKey) { setMsgs(m=>[...m,{role:"user",content:text},{role:"assistant",content:"⚠️ No API key — get a FREE Groq key at console.groq.com and enter it on the login screen."}]); setInput(""); return; }
    const history=[...msgs,{role:"user",content:text}];
    setMsgs(history); setInput(""); setBusy(true);
    try {
      const sys=`You are the PocketIQ assistant. Today: ${today()}. Currency: ${currency}. Entries: ${eRef.current.length}. Tags: ${TAGS.join(", ")}. Be brief and friendly.`;
      let messages=history.slice(-14);
      for (let i=0;i<6;i++) {
        const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{ method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey}, body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:800,messages:[{role:"system",content:sys},...messages.filter(m=>typeof m.content==="string")],temperature:0.7}) });
        const data=await res.json();
        if (data.error) { setMsgs([...history,{role:"assistant",content:"API Error: "+data.error.message}]); break; }
        if (!data.choices||!data.choices[0]) { setMsgs([...history,{role:"assistant",content:"Bad response — check your Groq API key."}]); break; }
        setMsgs([...history,{role:"assistant",content:data.choices[0].message.content||"Done!"}]); break;
      }
    } catch(err) { setMsgs([...history,{role:"assistant",content:"⚠️ Error: "+err.message}]); }
    setBusy(false);
  };

  const startVoice = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }
    const r=new SR(); r.lang="en-US";
    r.onstart=()=>setRec(true); r.onend=()=>setRec(false);
    r.onresult=ev=>send(ev.results[0][0].transcript);
    r.start();
  };

  return (
    <div style={{ width:330, background:"#fff", borderLeft:"1px solid #f0ece6", display:"flex", flexDirection:"column", maxHeight:"calc(100vh - 58px)" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #f0ece6", display:"flex", alignItems:"center", gap:8 }}>
        <span>🤖</span>
        <span style={{ fontWeight:700, color:"#1a1a2e" }}>Ask IQ</span>
        <span style={{ fontSize:10, background:"#fff3e0", color:"#f97316", borderRadius:5, padding:"2px 7px", fontWeight:700 }}>AI</span>
        <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20, lineHeight:1 }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:9 }}>
        {msgs.length===0 && (
          <div style={{ textAlign:"center", color:"#94a3b8", fontSize:13, marginTop:24 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>💡</div>
            <div style={{ marginBottom:10 }}>Ask me anything!</div>
            {TIPS.map(s=><div key={s} onClick={()=>send(s)} style={{ background:"#faf8f5", border:"1px solid #f0ece6", borderRadius:8, padding:"6px 10px", margin:"4px auto", cursor:"pointer", fontSize:12, maxWidth:260 }}>{s}</div>)}
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"86%", background:m.role==="user"?"#f97316":"#f8f9fa", color:m.role==="user"?"#fff":"#1a1a2e", borderRadius:m.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px", padding:"8px 12px", fontSize:13, lineHeight:1.5 }}>{m.content}</div>
          </div>
        ))}
        {busy && <div style={{ background:"#f8f9fa", borderRadius:12, padding:"9px 14px", fontSize:18, color:"#94a3b8", display:"flex", gap:3 }}>{[0,1,2].map(i=><span key={i} style={{ animation:`blink 1s ${i*0.3}s infinite`, display:"inline-block" }}>·</span>)}</div>}
      </div>
      <div style={{ padding:"9px 10px", borderTop:"1px solid #f0ece6", display:"flex", gap:6 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)} placeholder="Type a message…"
          style={{ flex:1, border:"1px solid #f0ece6", borderRadius:10, padding:"8px 11px", fontSize:13, outline:"none" }}/>
        <button onClick={startVoice} style={{ background:rec?"#ef4444":"#f0ece6", color:rec?"#fff":"#64748b", border:"none", borderRadius:10, width:34, cursor:"pointer", fontSize:15 }}>🎤</button>
        <button onClick={()=>send(input)} disabled={busy} style={{ background:"#f97316", color:"#fff", border:"none", borderRadius:10, padding:"0 12px", cursor:"pointer", fontSize:16, fontWeight:700 }}>→</button>
      </div>
    </div>
  );
}

// ─── Tests Tab ───────────────────────────────────────────────────
function TestsTab({ results, onRun }) {
  const pass = results ? results.filter(r=>r.pass).length : 0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:22, color:"#1a1a2e", flex:1 }}>Unit Tests</div>
        <button onClick={onRun} style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:10, padding:"9px 20px", fontWeight:700, fontSize:14, cursor:"pointer" }}>▶ Run All Tests</button>
      </div>
      {results && (
        <div style={{ background:"#fff", borderRadius:14, padding:"14px 18px", border:"1px solid #f0ece6", marginBottom:12 }}>
          <span style={{ fontWeight:700, fontSize:18, color:pass===results.length?"#10b981":"#f59e0b" }}>{pass}/{results.length} passed</span>
          <span style={{ marginLeft:12, fontSize:13, color:"#94a3b8" }}>{Math.round((pass/results.length)*100)}%</span>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {(results||[]).map((r,i)=>(
          <div key={i} style={{ background:"#fff", borderRadius:10, padding:"10px 16px", border:"1px solid #f0ece6", display:"flex", alignItems:"center", gap:10 }}>
            <span>{r.pass?"✅":"❌"}</span>
            <span style={{ flex:1, fontSize:13, color:"#1a1a2e", fontWeight:600 }}>{r.name}</span>
            {!r.pass && <span style={{ fontSize:11, color:"#ef4444", fontFamily:"monospace" }}>got {r.got}</span>}
          </div>
        ))}
      </div>
      {!results && <div style={{ textAlign:"center", color:"#94a3b8", padding:40 }}>Click "Run All Tests" to start</div>}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
function PocketIQ() {
  const [authed,   setAuthed]   = useState(false);
  const [username, setUsername] = useState("");
  const [apiKey,   setApiKey]   = useState("");
  const [entries,  setEntries]  = useState([]);
  const [wallets,  setWallets]  = useState([
    { id:uid(), name:"Food & Dining",  tag:"Food",          limitUsd:300 },
    { id:uid(), name:"Transport",      tag:"Transport",     limitUsd:150 },
    { id:uid(), name:"Entertainment",  tag:"Entertainment", limitUsd:100 },
  ]);
  const [tab,      setTab]      = useState("overview");
  const [currency, setCurrency] = useState("USD");
  const [modal,    setModal]    = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [filter,   setFilter]   = useState({ tag:"All", search:"" });
  const [testRes,  setTestRes]  = useState(null);

  // Inject fonts safely
  useEffect(()=>{
    const id="piq-gf";
    if (!document.getElementById(id)) {
      const l=document.createElement("link"); l.id=id; l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  // Load persisted state
  useEffect(()=>{
    (async()=>{
      try {
        const u=await store.get("user");   if (u) { setUsername(u); setAuthed(true); }
        const k=await store.get("apikey"); if (k) setApiKey(k);
        const e=await store.get("entries"); if (e) setEntries(JSON.parse(e));
        const w=await store.get("wallets"); if (w) setWallets(JSON.parse(w));
        const c=await store.get("currency"); if (c) setCurrency(c);
      } catch {}
    })();
  },[]);

  const saveE = (arr) => { setEntries(arr); store.set("entries",JSON.stringify(arr)); };
  const saveW = (arr) => { setWallets(arr); store.set("wallets",JSON.stringify(arr)); };

  const mutate = (op, entry) => {
    setEntries(prev=>{
      const next = op==="add" ? [entry,...prev] : op==="update" ? prev.map(e=>e.id===entry.id?entry:e) : prev.filter(e=>e.id!==entry.id);
      store.set("entries",JSON.stringify(next));
      return next;
    });
  };

  const handleLogin = async (name, key, demo) => {
    setUsername(name); setApiKey(key||"");
    await store.set("user",name);
    if (key) await store.set("apikey",key);
    if (demo) saveE(DEMO);
    setAuthed(true);
  };

  const exportCSV = () => {
    const c=getCur(currency);
    const vis=entries.filter(e=>(filter.tag==="All"||e.tag===filter.tag)&&(!filter.search||e.title.toLowerCase().includes(filter.search.toLowerCase())));
    const rows=[["Date","Title","Tag","USD","Amount ("+currency+")","Method","Note"],...vis.map(e=>[e.date,e.title,e.tag,e.amount.toFixed(2),(e.amount*c.rate).toFixed(2),e.method,e.note||""])];
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"})); a.download="pocketiq.csv"; a.click();
  };

  const exportPDF = () => {
    const c=getCur(currency);
    const vis=entries.filter(e=>(filter.tag==="All"||e.tag===filter.tag)&&(!filter.search||e.title.toLowerCase().includes(filter.search.toLowerCase())));
    const total=vis.reduce((s,e)=>s+e.amount,0);
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>PocketIQ</title><style>body{font-family:sans-serif;padding:28px}h1{color:#f97316}table{width:100%;border-collapse:collapse}th{background:#f97316;color:#fff;padding:8px;text-align:left}td{padding:7px;border-bottom:1px solid #eee}.tot{font-size:20px;color:#f97316;font-weight:700;margin:10px 0}@media print{button{display:none}}</style></head><body><h1>PocketIQ Report</h1><p>${new Date().toLocaleDateString()} · ${currency}</p><div class="tot">Total: ${c.sym}${(total*c.rate).toFixed(2)}</div><table><tr><th>Date</th><th>Title</th><th>Tag</th><th>Amount</th></tr>${vis.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${e.title}</td><td>${e.tag}</td><td>${c.sym}${(e.amount*c.rate).toFixed(2)}</td></tr>`).join("")}</table><script>window.print()<\/script></body></html>`);
  };

  const runTests = () => {
    const r=[]; const ok=(n,v)=>r.push({name:n,pass:!!v,got:String(v)}); const eq=(n,g,x)=>r.push({name:n,pass:Math.abs(Number(g)-Number(x))<0.01||JSON.stringify(g)===JSON.stringify(x),got:JSON.stringify(g)});
    ok("uid() is string",          typeof uid()==="string");
    ok("uid() is unique",          uid()!==uid());
    ok("today() is YYYY-MM-DD",    /^\d{4}-\d{2}-\d{2}$/.test(today()));
    ok("fmtDate includes month",   fmtDate("2024-03-15").includes("Mar"));
    ok("dayOff(0) === today()",    dayOff(0)===today());
    ok("dayOff(-1) < today()",     dayOff(-1)<today());
    eq("USD rate is 1",            getCur("USD").rate,1);
    ok("USD symbol is $",          getCur("USD").sym==="$");
    ok("fmtAmt USD 100",           fmtAmt(100,"USD")==="$100.00");
    ok("fmtAmt EUR has €",         fmtAmt(100,"EUR").includes("€"));
    ok("fmtAmt INR has ₹",         fmtAmt(100,"INR").includes("₹"));
    eq("CURRENCIES count",         CURRENCIES.length,9);
    eq("TAGS count",               TAGS.length,10);
    ok("TAGS has Food",            TAGS.includes("Food"));
    ok("TAGS has Travel",          TAGS.includes("Travel"));
    const s=[{id:"1",title:"Pizza",tag:"Food",amount:20,date:today(),method:"cash",note:""},{id:"2",title:"Bus",tag:"Transport",amount:5,date:today(),method:"cash",note:""}];
    eq("filter by tag count",      s.filter(e=>e.tag==="Food").length,1);
    eq("total amounts",            s.reduce((a,e)=>a+e.amount,0),25);
    eq("search filter",            s.filter(e=>e.title.toLowerCase().includes("piz")).length,1);
    const rec=detectRecurring([{id:"a",title:"Netflix",tag:"Entertainment",amount:16,date:dayOff(-30),method:"card",note:""},{id:"b",title:"Netflix",tag:"Entertainment",amount:16,date:dayOff(-1),method:"card",note:""}]);
    eq("recurring count",          rec.length,1);
    ok("recurring freq Monthly",   rec[0]?.freq==="Monthly");
    setTestRes(r);
  };

  const now=new Date(); const mk=now.toISOString().slice(0,7);
  const monthEntries=entries.filter(e=>e.date.startsWith(mk));

  if (!authed) return <LoginScreen onLogin={handleLogin}/>;

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", background:"#faf8f5", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#f0ece6;border-radius:4px}`}</style>

      {/* Topbar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #f0ece6", padding:"0 20px", display:"flex", alignItems:"center", gap:14, height:56, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 6px #0000000a", flexShrink:0 }}>
        <div style={{ fontWeight:700, fontSize:20, color:"#1a1a2e" }}>Pocket<span style={{ color:"#f97316" }}>IQ</span></div>
        <div style={{ width:1, height:24, background:"#f0ece6" }}/>
        {[{k:"overview",l:"Overview"},{k:"entries",l:"Entries"},{k:"analytics",l:"Analytics"},{k:"wallets",l:"Wallets"},{k:"tests",l:"Tests"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{ background:tab===t.k?"#fff3e0":"transparent", color:tab===t.k?"#f97316":"#64748b", border:"none", borderRadius:8, padding:"5px 12px", fontWeight:700, fontSize:13, cursor:"pointer" }}>{t.l}</button>
        ))}
        <div style={{ flex:1 }}/>
        <select value={currency} onChange={async e=>{setCurrency(e.target.value);await store.set("currency",e.target.value);}} style={{ border:"1px solid #f0ece6", borderRadius:8, padding:"5px 9px", fontSize:13, background:"#fff", cursor:"pointer" }}>
          {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
        <button onClick={()=>setModal("new")} style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", border:"none", borderRadius:10, padding:"7px 15px", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add Entry</button>
        <button onClick={()=>setChatOpen(x=>!x)} style={{ background:chatOpen?"#f97316":"#fff", color:chatOpen?"#fff":"#f97316", border:"2px solid #f97316", borderRadius:10, padding:"5px 12px", fontWeight:700, fontSize:13, cursor:"pointer" }}>💬 Ask IQ</button>
        <div onClick={async()=>{await store.set("user","");setAuthed(false);setEntries([]);}} style={{ color:"#94a3b8", fontSize:12, cursor:"pointer" }} title="Log out">👤 {username}</div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ flex:1, padding:24, overflowY:"auto" }}>
          {tab==="overview"  && <OverviewTab  entries={entries} currency={currency}/>}
          {tab==="entries"   && <EntriesTab   entries={entries} currency={currency} filter={filter} setFilter={setFilter} onEdit={e=>setModal(e)} onDelete={id=>mutate("delete",{id})} onAddScanned={e=>mutate("add",{...e,id:e.id||uid()})} exportCSV={exportCSV} exportPDF={exportPDF} apiKey={apiKey}/>}
          {tab==="analytics" && <AnalyticsTab entries={entries} currency={currency}/>}
          {tab==="wallets"   && <WalletsTab   wallets={wallets} monthEntries={monthEntries} currency={currency} onUpdate={saveW}/>}
          {tab==="tests"     && <TestsTab     results={testRes} onRun={runTests}/>}
        </div>
        {chatOpen && <ChatPanel entries={entries} currency={currency} apiKey={apiKey} onMutate={mutate} onClose={()=>setChatOpen(false)}/>}
      </div>

      {modal && <EntryModal initial={modal==="new"?null:modal} onSave={e=>{mutate(entries.some(x=>x.id===e.id)?"update":"add",e);setModal(null);}} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────
export default function App() {
  return <ErrorBoundary><PocketIQ /></ErrorBoundary>;
}
