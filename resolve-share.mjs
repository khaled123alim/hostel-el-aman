const BASE = "http://localhost:9222";
const log = (...a) => console.log(new Date().toISOString(), ...a);
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws error")); });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) { const p = c.pending.get(msg.id); if (p) { c.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); } }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("CDP timeout: " + method)), 30000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return r.result && r.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const urls = [
    "https://share.google/Fxe6xMjPReKrkFu1R",
    "https://share.google.com/Fxe6xMjPReKrkFu1R",
    "https://www.google.com/maps/share/Fxe6xMjPReKrkFu1R",
  ];
  const targets = await (await fetch(`${BASE}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const c = await CDP.connect(page.webSocketDebuggerUrl);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  for (const u of urls) {
    try {
      await c.send("Page.navigate", { url: u });
      await sleep(6000);
      const snap = await c.eval(`JSON.stringify({ href: location.href, title: document.title, text: document.body ? document.body.innerText.slice(0, 120) : '' })`);
      log(u, "->", snap);
    } catch (e) { log(u, "FAIL", e.message); }
  }
  c.close();
}
main().then(() => process.exit(0)).catch((e) => { log("FATAL", e.message); process.exit(1); });