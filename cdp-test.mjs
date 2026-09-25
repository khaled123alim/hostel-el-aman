const BASE = "http://localhost:9222";
const log = (...a) => console.log(new Date().toISOString(), ...a);

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws error")); });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) {
        const p = c.pending.get(msg.id);
        if (p) { c.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      } else c.events.push(msg);
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("CDP timeout: " + method)), 25000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { error: r.exceptionDetails.text };
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const targets = await (await fetch(`${BASE}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const c = await CDP.connect(page.webSocketDebuggerUrl);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  await c.send("Log.enable");

  await c.send("Page.navigate", { url: "http://localhost:3000/login" });
  await sleep(7000);
  await c.eval(`(async () => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@stayhub.com', password: 'Admin@12345' }) });
    return r.status;
  })()`);
  log("logged in");
  await c.send("Page.navigate", { url: "http://localhost:3000/admin/reservations/new" });
  await sleep(9000);

  const findTrigger = (labelRe) => `Array.from(document.querySelectorAll('button')).find(b => ${labelRe}.test(b.textContent || ''))`;

  // 1) Open client select, pick option[2] (third customer)
  await c.eval(`(${findTrigger}(/اختر عميل/) || ${findTrigger}(/S[ée]lectionner un client/)).click()`);
  await sleep(1200);
  const pick2 = await c.eval(`(() => {
    const opts = Array.from(document.querySelectorAll('[role="listbox"] [role="option"]'));
    if (opts.length < 3) return { ok: false, n: opts.length };
    opts[2].click();
    return { ok: true };
  })()`);
  log("picked 3rd customer:", JSON.stringify(pick2));
  await sleep(1000);
  const val1 = await c.eval(`(() => {
    const t = Array.from(document.querySelectorAll('button')).find(b => /@|\\u00b7/.test(b.textContent || ''));
    return { trigger: t ? (t.textContent||'').trim().slice(0,40) : null, listboxMounted: !!document.querySelector('[role="listbox"]') };
  })()`);
  log("after first selection:", JSON.stringify(val1));

  // 2) Try to REOPEN the same client select
  await c.eval(`(${findTrigger}(/@|\\u00b7/) || Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').trim().startsWith('khaled')) || Array.from(document.querySelectorAll('button'))[2]).click()`);
  await sleep(1200);
  const reopen = await c.eval(`(() => {
    const lb = document.querySelector('[role="listbox"]');
    return { reOpened: !!lb, count: lb ? lb.querySelectorAll('[role="option"]').length : 0 };
  })()`);
  log("reopen same select:", JSON.stringify(reopen));

  // 3) Now try the HOSTEL select
  await c.eval(`(${findTrigger}(/اختر نزل/) || ${findTrigger}(/S[ée]lectionner une auberge/)).click()`);
  await sleep(1200);
  const hostel = await c.eval(`(() => {
    const lb = document.querySelector('[role="listbox"]');
    const opts = lb ? Array.from(lb.querySelectorAll('[role="option"]')) : [];
    return { open: !!lb, count: opts.length, first: opts[0] ? (opts[0].textContent||'').trim().slice(0,40) : null };
  })()`);
  log("hostel select:", JSON.stringify(hostel));

  // 4) Scan for ghost full-viewport elements capturing pointer events
  const ghosts = await c.eval(`(() => {
    const out = [];
    const vw = window.innerWidth, vh = window.innerHeight;
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width < vw * 0.9 || r.height < vh * 0.6) continue;
      const st = getComputedStyle(el);
      if (st.pointerEvents === 'none' || st.display === 'none' || st.visibility === 'hidden') continue;
      if (el.id === 'next-script' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      out.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,60), z: st.zIndex, pe: st.pointerEvents, w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out.slice(0, 12);
  })()`);
  log("ghost overlays:", JSON.stringify(ghosts));

  const ex = c.events.filter(e => e.method === "Runtime.exceptionThrown").slice(0, 10);
  log("EXCEPTIONS:", JSON.stringify(ex.map(e => (e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description) || e.params.exceptionDetails.text)));
  c.close();
}
main().then(() => { log("DONE"); process.exit(0); }).catch((e) => { log("FATAL", e.message); process.exit(1); });