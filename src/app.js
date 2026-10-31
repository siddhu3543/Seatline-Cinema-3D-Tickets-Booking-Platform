'use strict';
/* ================= utilities ================= */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => { const v = Math.round(n * 100) / 100; const f = v % 1 ? 2 : 0; return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: f, maximumFractionDigits: f }); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const ROWL = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const rowLabel = i => i < 24 ? ROWL[i] : ROWL[Math.floor(i / 24) - 1] + ROWL[i % 24];
const slug = s => (String(s || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'item') + '-' + Math.random().toString(36).slice(2, 6);
const FEE = 30, GST = 0.18, MAX_SEATS = 10;
const LANGS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Other'];
const CERTS = ['U', 'U/A 7+', 'U/A 13+', 'U/A 16+', 'A'];

function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const z2 = n => String(n).padStart(2, '0');
const isoDate = d => d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate());
const parseISO = s => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return isoDate(d); };
const fmtDate = (s, o) => parseISO(s).toLocaleDateString('en-IN', o || { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = t => { const p = String(t).split(':').map(Number); const h = p[0] % 12 || 12; return h + ':' + z2(p[1]) + (p[0] < 12 ? ' AM' : ' PM'); };
const fmtRun = m => m ? Math.floor(m / 60) + 'h ' + z2(m % 60) + 'm' : '';
const showIdOf = (movieId, theatreId, date, time) => movieId + '~' + theatreId + '~' + date + '~' + String(time).replace(':', '');
function priceOf(seats) {
  const sub = seats.reduce((a, s) => a + s.price, 0);
  const fee = FEE * seats.length;
  const gst = Math.round(fee * GST * 100) / 100;
  return { sub: sub, fee: fee, gst: gst, total: sub + fee + gst };
}
function bookingCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'SL-'; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function prefs(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('seatline-pref-' + k) || 'null'); localStorage.setItem('seatline-pref-' + k, JSON.stringify(v)); } catch (e) { return null; } }

const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/></svg>',
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>',
  seat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 13V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/><path d="M4 13h16v4H4zM6 17v3M18 17v3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  upi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 3l6 9-6 9M13 3l6 9-6 9"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4"/><circle cx="16.5" cy="13.5" r="1.3" fill="currentColor"/></svg>'
};

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ================= procedural art (posters + screen loops) ================= */
function artOf(m) {
  if (m.art) return m.art;
  const h = hashStr(m.id || m.title || 'x');
  const hue = h % 360;
  return { c1: 'hsl(' + hue + ',45%,9%)', c2: 'hsl(' + ((hue + 30) % 360) + ',55%,38%)', c3: '#f6e7c8', motif: ['rain', 'beam', 'orbit', 'stripes'][h % 4] };
}
function fitFont(ctx, text, maxW, size, weight) {
  let s = size;
  do { ctx.font = weight + ' ' + s + 'px "Big Shoulders Display", Impact, sans-serif'; s -= 2; } while (ctx.measureText(text).width > maxW && s > 12);
  return s + 2;
}
function drawMotif(ctx, w, h, a, t, seed) {
  const r = rng(seed);
  ctx.save();
  if (a.motif === 'rain') {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.78, 10, w * 0.5, h * 0.78, w * 0.6);
    g.addColorStop(0, a.c3 + '55'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = a.c3; ctx.lineWidth = Math.max(1, w / 500);
    for (let i = 0; i < 140; i++) {
      const x0 = r() * w * 1.2, sp = 260 + r() * 260, off = r() * h, al = 0.08 + r() * 0.25;
      const y = ((off + t * sp) % (h + 60)) - 30, x = x0 - (y * 0.25);
      ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 26); ctx.stroke();
    }
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#000';
    for (let i = 0; i < 9; i++) { const bw = w * (0.04 + r() * 0.07), bh = h * (0.12 + r() * 0.28), bx = (i / 9) * w + r() * 20; ctx.fillRect(bx, h * 0.82 - bh, bw, bh + h); }
  } else if (a.motif === 'beam') {
    ctx.fillStyle = a.c3;
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.2 + r() * 0.6 * (0.6 + 0.4 * Math.sin(t * 2 + i)); ctx.fillRect(r() * w, r() * h * 0.6, 1.6, 1.6); }
    const lx = w * 0.7, ly = h * 0.5, ang = t * 0.7;
    ctx.globalAlpha = 0.32;
    const len = w * 1.2;
    [ang, ang + Math.PI].forEach(an => {
      const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(an) * len, ly + Math.sin(an) * len * 0.25);
      g.addColorStop(0, a.c3); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(an - 0.09) * len, ly + Math.sin(an - 0.09) * len * 0.25);
      ctx.lineTo(lx + Math.cos(an + 0.09) * len, ly + Math.sin(an + 0.09) * len * 0.25);
      ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = '#0a0709';
    ctx.beginPath(); ctx.moveTo(lx - w * 0.03, h); ctx.lineTo(lx - w * 0.018, ly + 6); ctx.lineTo(lx + w * 0.018, ly + 6); ctx.lineTo(lx + w * 0.03, h); ctx.fill();
    ctx.fillStyle = a.c3; ctx.beginPath(); ctx.arc(lx, ly, w * 0.012, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0709'; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(0, h * 0.86); for (let x = 0; x <= w; x += w / 20) ctx.lineTo(x, h * 0.86 + Math.sin(x / w * 9 + t) * h * 0.012); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  } else if (a.motif === 'orbit') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 110; i++) { ctx.globalAlpha = r() * 0.8; ctx.fillRect(r() * w, r() * h, 1.4, 1.4); }
    const cx = w * 0.5, cy = h * 0.52;
    ctx.strokeStyle = a.c3; ctx.lineWidth = Math.max(1, w / 600);
    for (let k = 0; k < 4; k++) {
      const rx = w * (0.18 + k * 0.1), ry = rx * 0.32, rot = -0.25 + k * 0.05;
      ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); ctx.stroke();
      const an = t * (0.6 - k * 0.1) + k * 1.7, px = cx + Math.cos(an) * rx * Math.cos(rot) - Math.sin(an) * ry * Math.sin(rot), py = cy + Math.cos(an) * rx * Math.sin(rot) + Math.sin(an) * ry * Math.cos(rot);
      ctx.globalAlpha = 1; ctx.fillStyle = a.c3; ctx.beginPath(); ctx.arc(px, py, w * 0.006, 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(cx - w * 0.02, cy - w * 0.02, 2, cx, cy, w * 0.08);
    g.addColorStop(0, a.c3); g.addColorStop(1, a.c2);
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, w * 0.07, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.globalAlpha = 0.16; ctx.fillStyle = a.c3;
    const bw = w / 9;
    for (let i = -4; i < 14; i++) { const x = i * bw * 1.4 + (t * 18) % (bw * 1.4); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + bw * 0.6, 0); ctx.lineTo(x + bw * 0.6 - h * 0.5, h); ctx.lineTo(x - h * 0.5, h); ctx.fill(); }
    ctx.globalAlpha = 0.5; ctx.strokeStyle = a.c3; ctx.lineWidth = Math.max(1.5, w / 300); ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath(); const bx = w * (0.38 + k * 0.12);
      for (let y = h * 0.9; y > h * 0.25; y -= 4) { const x = bx + Math.sin(y / (h * 0.08) + t * 1.5 + k) * w * 0.02; y === h * 0.9 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#120603';
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.95, w * 0.26, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawArt(ctx, w, h, m, t, kind) {
  const a = artOf(m), seed = hashStr(m.id || m.title);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, a.c1); g.addColorStop(1, a.c2);
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawMotif(ctx, w, h, a, t, seed);
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  const title = String(m.title || 'Untitled').toUpperCase();
  ctx.fillStyle = a.c3; ctx.textBaseline = 'alphabetic';
  if (kind === 'screen') {
    ctx.textAlign = 'center';
    ctx.font = '600 ' + Math.round(h * 0.05) + 'px "Figtree", sans-serif';
    ctx.globalAlpha = 0.85;
    ctx.fillText(('Now showing  ·  ' + (m.language || '') + '  ·  ' + (m.cert || '')).toUpperCase(), w / 2, h * 0.24);
    ctx.globalAlpha = 1;
    const fs = fitFont(ctx, title, w * 0.84, Math.round(h * 0.26), '900');
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
    ctx.fillText(title, w / 2, h * 0.5 + fs * 0.35);
    ctx.shadowBlur = 0;
  } else {
    ctx.textAlign = 'left';
    const pad = w * 0.08;
    ctx.font = '600 ' + Math.round(w * 0.04) + 'px "Figtree", sans-serif';
    ctx.globalAlpha = 0.85; ctx.fillText(((/^[AEIOU]/i.test(m.language || '') ? 'An ' : 'A ') + (m.language || '') + ' film').toUpperCase(), pad, pad + w * 0.03);
    ctx.globalAlpha = 1;
    const words = title.split(/\s+/); const lines = []; let cur = '';
    ctx.font = '900 ' + Math.round(w * 0.2) + 'px "Big Shoulders Display", Impact, sans-serif';
    words.forEach(wd => { const tst = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tst).width > w - pad * 2 && cur) { lines.push(cur); cur = wd; } else cur = tst; });
    if (cur) lines.push(cur);
    let fs = Math.round(w * 0.2);
    lines.forEach(l => { fs = Math.min(fs, fitFont(ctx, l, w - pad * 2, fs, '900')); });
    ctx.font = '900 ' + fs + 'px "Big Shoulders Display", Impact, sans-serif';
    const base = h - pad - w * 0.1;
    lines.slice().reverse().forEach((l, i) => ctx.fillText(l, pad, base - i * fs * 0.92));
    ctx.font = '600 ' + Math.round(w * 0.036) + 'px "Figtree", sans-serif';
    ctx.globalAlpha = 0.8;
    ctx.fillText([(m.genre || ''), m.cert || '', fmtRun(m.runtime)].filter(Boolean).join('  ·  ').toUpperCase(), pad, h - pad);
    ctx.globalAlpha = 1;
  }
}
const posterCache = {};
function posterSrc(m) {
  if (m.poster) { const u = S.store.mediaUrl(m.poster); if (u) return u; }
  const key = [m.id, m.title, m.language, m.genre, m.cert, m.runtime, JSON.stringify(artOf(m))].join('|');
  if (!posterCache[key]) {
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 600;
    drawArt(cv.getContext('2d'), 400, 600, m, 1.3, 'poster');
    posterCache[key] = cv.toDataURL('image/jpeg', 0.86);
  }
  return posterCache[key];
}
function screenMedia(m) {
  if (m.media && m.media.ref) { const u = S.store.mediaUrl(m.media.ref); if (u) return { kind: m.media.kind === 'video' ? 'video' : 'image', url: u }; }
  if (m.poster) { const u = S.store.mediaUrl(m.poster); if (u) return { kind: 'image', url: u }; }
  return { kind: 'canvas', draw: (ctx, w, h, t) => drawArt(ctx, w, h, m, t, 'screen') };
}

/* ================= data stores ================= */
const DEMO_KEY = 'seatline-demo-v1';
class DemoStore {
  constructor() {
    this.mode = 'demo'; this.subs = new Set(); this.objectUrls = {};
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !d.theatres) {
      const s = buildSeed(); d = { theatres: {}, movies: {}, seatmaps: {}, bookings: {}, media: {} };
      s.theatres.forEach(t => { d.theatres[t.id] = t; }); s.movies.forEach(m => { d.movies[m.id] = m; });
    }
    this.d = d; this.uid = 'demo-user';
  }
  save() {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(this.d)); }
    catch (e) { const m = this.d.media; this.d.media = {}; try { localStorage.setItem(DEMO_KEY, JSON.stringify(this.d)); } catch (e2) {} this.d.media = m; }
  }
  emit() { this.save(); this.subs.forEach(f => f()); }
  on(f) { this.subs.add(f); f(); return () => this.subs.delete(f); }
  watchCatalog(cb) { return this.on(() => cb(Object.values(this.d.theatres), Object.values(this.d.movies))); }
  demoTaken(showId, theatre) {
    const out = {}; if (!theatre) return out;
    const rate = 0.12 + (hashStr(showId) % 1000) / 1000 * 0.38;
    computeSeats(theatre).seats.forEach(s => { if ((hashStr(showId + s.id) % 1000) / 1000 < rate) out[s.id] = 'demo'; });
    return out;
  }
  watchSeatmap(showId, cb) {
    const th = this.d.theatres[showId.split('~')[1]];
    return this.on(() => cb(Object.assign(this.demoTaken(showId, th), (this.d.seatmaps[showId] || {}).taken || {})));
  }
  watchMyBookings(cb) { return this.on(() => cb(Object.values(this.d.bookings))); }
  watchAllBookings(cb) { return this.on(() => cb(Object.values(this.d.bookings))); }
  async put(coll, obj) { this.d[coll][obj.id] = clone(obj); this.emit(); }
  async remove(coll, id) { delete this.d[coll][id]; this.emit(); }
  async upload(file) {
    const id = Math.random().toString(36).slice(2, 10);
    if (file.type.startsWith('image/') && file.size < 1.5e6) {
      const url = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
      this.d.media[id] = url; this.save(); return 'm:' + id;
    }
    this.objectUrls[id] = URL.createObjectURL(file);
    return 'o:' + id;
  }
  mediaUrl(ref) {
    if (!ref) return null;
    const k = ref.slice(2);
    if (ref.startsWith('m:')) return this.d.media[k] || null;
    if (ref.startsWith('o:')) return this.objectUrls[k] || null;
    return null;
  }
  async book(o) {
    await sleep(700);
    const th = this.d.theatres[o.theatreId];
    const taken = Object.assign(this.demoTaken(o.showId, th), (this.d.seatmaps[o.showId] || {}).taken || {});
    const clash = o.seats.filter(s => taken[s]);
    if (clash.length) return { ok: false, clash: clash, msg: clash.join(', ') + ' just got booked by someone else.' };
    const id = bookingCode();
    const sm = this.d.seatmaps[o.showId] || (this.d.seatmaps[o.showId] = { showId: o.showId, taken: {} });
    o.seats.forEach(s => { sm.taken[s] = id; });
    const b = Object.assign({}, o.record, { id: id, ownerId: this.uid });
    this.d.bookings[id] = b; this.emit();
    return { ok: true, booking: b };
  }
  async cancel(b) {
    const sm = this.d.seatmaps[b.showId];
    if (sm) Object.keys(sm.taken).forEach(k => { if (sm.taken[k] === b.id) delete sm.taken[k]; });
    if (this.d.bookings[b.id]) { this.d.bookings[b.id].status = 'cancelled'; this.d.bookings[b.id].cancelledAt = new Date().toISOString(); }
    this.emit();
  }
}

class LiveStore {
  constructor(db, assets, uid) { this.mode = 'live'; this.db = db; this.assets = assets; this.uid = uid; }
  watchCatalog(cb, onErr) {
    let th = null, mv = null;
    const fire = () => { if (th && mv) cb(th, mv); };
    const a = this.db.collection('theatres').onSnapshot(s => { th = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); fire(); }, onErr);
    const b = this.db.collection('movies').onSnapshot(s => { mv = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); fire(); }, onErr);
    return () => { a(); b(); };
  }
  watchSeatmap(showId, cb) {
    return this.db.doc('seatmaps/' + showId).onSnapshot(s => cb(s.exists ? Object.assign({}, (s.data().taken || {})) : {}), () => toast('Live seat updates paused. Reopen the show to refresh.'));
  }
  itemsOf(d, owner) { const items = (d.exists && d.data().items) || {}; return Object.keys(items).map(k => Object.assign({}, items[k], { id: k, ownerId: owner })); }
  watchMyBookings(cb) {
    if (!this.uid) { cb([]); return () => {}; }
    return this.db.doc('bookings/' + this.uid).onSnapshot(s => cb(this.itemsOf(s, this.uid)), () => cb([]));
  }
  watchAllBookings(cb) {
    return this.db.collection('bookings').onSnapshot(s => cb([].concat.apply([], s.docs.map(d => this.itemsOf(d, d.id)))), () => cb([]));
  }
  async put(coll, obj) { const o = clone(obj); const id = o.id; delete o.id; await this.db.doc(coll + '/' + id).set(o); }
  async remove(coll, id) { await this.db.doc(coll + '/' + id).delete(); }
  async upload(file) {
    if (!this.assets) throw { code: 'not_granted' };
    const r = await this.assets.upload(file);
    return 'a:' + r.id;
  }
  mediaUrl(ref) { return ref && ref.startsWith('a:') ? '/_blob/' + ref.slice(2) : null; }
  async book(o) {
    if (!this.uid) return { ok: false, msg: 'Sign in to Claude to book tickets.' };
    const ref = this.db.doc('seatmaps/' + o.showId);
    try {
      let lease = null;
      for (let i = 0; i < 4; i++) {
        lease = await ref.acquire({ holder: this.uid, ttlMs: 4000 });
        if (lease.acquired) break;
        await sleep(900);
      }
      if (!lease || !lease.acquired) return { ok: false, msg: 'Another booking for this show is being confirmed. Try again in a few seconds.' };
      const snap = await ref.get();
      const taken = snap.exists ? (snap.data().taken || {}) : {};
      const clash = o.seats.filter(s => taken[s]);
      if (clash.length) return { ok: false, clash: clash, msg: clash.join(', ') + ' just got booked by someone else.' };
      const id = bookingCode();
      const add = {}; o.seats.forEach(s => { add[s] = id; });
      if (snap.exists) await ref.update({ taken: add }); else await ref.set({ showId: o.showId, taken: add });
      const rec = clone(o.record);
      const bref = this.db.doc('bookings/' + this.uid);
      try {
        const bs = await bref.get();
        if (bs.exists) await bref.update({ items: { [id]: rec } }); else await bref.set({ items: { [id]: rec } });
      } catch (e) {
        const back = Object.assign({}, taken); await ref.set({ showId: o.showId, taken: back }).catch(() => {});
        throw e;
      }
      return { ok: true, booking: Object.assign({}, rec, { id: id, ownerId: this.uid }) };
    } catch (e) {
      if (e && e.code === 'invalid_argument') return { ok: false, msg: 'Your access to this page is view-only, so the booking could not be saved. Ask the owner for Contributor access.' };
      if (e && e.code === 'quota_exceeded') return { ok: false, msg: 'The booking store is full. Ask the owner to clear old bookings.' };
      return { ok: false, msg: 'The booking could not be saved (' + ((e && e.code) || 'error') + '). Try again.' };
    }
  }
  async cancel(b) {
    const ref = this.db.doc('seatmaps/' + b.showId);
    const snap = await ref.get();
    if (snap.exists) {
      const taken = Object.assign({}, snap.data().taken || {});
      Object.keys(taken).forEach(k => { if (taken[k] === b.id) delete taken[k]; });
      await ref.set({ showId: b.showId, taken: taken });
    }
    await this.db.doc('bookings/' + b.ownerId).update({ items: { [b.id]: { status: 'cancelled', cancelledAt: new Date().toISOString() } } });
  }
}

/* ================= app state ================= */
const S = {
  store: null, isAdmin: false, canUpload: false, sample: null, sampleImages: false,
  theatres: [], movies: [], my: [], all: [], loaded: false, slow: false,
  route: 'home', movieId: null, date: null, sub: null, order: null, lastBooking: null,
  adminTab: 'theatres', editing: null, stage: null, featureStop: null
};
const main = () => $('#main');
const theatreById = id => S.theatres.find(t => t.id === id);
const movieById = id => S.movies.find(m => m.id === id);
const openMovies = () => S.movies.filter(m => m.status !== 'hidden').sort((a, b) => String(a.title).localeCompare(b.title));

function datesFor(m) {
  const today = isoDate(new Date());
  const sc = m.schedule || {};
  const out = [];
  for (let i = 0; i < 14 && out.length < 7; i++) {
    const d = addDays(today, i);
    if ((!sc.start || d >= sc.start) && (!sc.end || d <= sc.end)) out.push(d);
  }
  return out;
}
function timePassed(date, time) {
  const now = new Date();
  if (date !== isoDate(now)) return false;
  const p = time.split(':').map(Number);
  return p[0] * 60 + p[1] <= now.getHours() * 60 + now.getMinutes() + 10;
}

/* ================= routing ================= */
function readHash() {
  const h = (location.hash || '').replace('#', '');
  if (h.startsWith('movie-')) { S.route = 'movie'; S.movieId = h.slice(6); }
  else if (h === 'tickets' || h === 'admin') S.route = h;
  else S.route = 'home';
}
function go(route, id) {
  closeStage();
  S.sub = null; S.viewTicket = null;
  if (S.editing && S.editing.hall) S.editing.hall.dispose();
  S.editing = null;
  const h = route === 'movie' ? 'movie-' + id : route;
  if (('#' + h) === location.hash) { readHash(); render(); }
  else location.hash = h;
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => { closeStage(); S.sub = null; S.viewTicket = null; if (S.editing && S.editing.hall) S.editing.hall.dispose(); S.editing = null; readHash(); render(); window.scrollTo(0, 0); });

function renderNav() {
  const items = [['home', 'Now showing'], ['tickets', 'My tickets']];
  if (S.isAdmin) items.push(['admin', 'Admin']);
  const cur = S.route === 'movie' ? 'home' : S.route;
  $('#nav').innerHTML = items.map(i => '<button data-go="' + i[0] + '"' + (cur === i[0] ? ' aria-current="page"' : '') + '>' + i[1] + '</button>').join('');
  const pill = $('#modePill');
  if (S.store && S.store.mode === 'demo') { pill.hidden = false; pill.textContent = 'Demo mode'; pill.title = 'Catalogue and bookings are saved in this browser only'; }
  else pill.hidden = true;
}

function render() {
  if (S.featureStop) { S.featureStop(); S.featureStop = null; }
  if (S.editing && S.editing.hall && S.route !== 'admin') { S.editing.hall.dispose(); S.editing = null; }
  renderNav();
  if (!S.loaded) {
    main().innerHTML = '<div class="loader"><div><div class="spin"></div>' + (S.slow ? 'The box office data can\'t be reached yet. It will appear as soon as the connection comes back.' : 'Opening the box office') + '</div></div>';
    return;
  }
  if (S.sub === 'checkout' && S.order) return renderCheckout();
  if (S.sub === 'ticket' && S.lastBooking) return renderTicket(S.lastBooking, true);
  if (S.route === 'movie') return renderMovie();
  if (S.route === 'tickets') { const vt = S.viewTicket && S.my.find(x => x.id === S.viewTicket); return vt ? renderTicket(vt, false) : renderTickets(); }
  if (S.route === 'admin') return renderAdmin();
  return renderHome();
}

/* ================= home ================= */
function metaHTML(m) {
  return '<div class="meta"><span class="cert">' + esc(m.cert || 'U') + '</span><span>' + esc(m.language || '') + '</span><span>' + esc(m.genre || '') + '</span><span>' + fmtRun(Number(m.runtime)) + '</span></div>';
}
function renderHome() {
  const ms = openMovies();
  if (!ms.length) {
    main().innerHTML = '<div class="empty"><h2>No movies are open for booking</h2><p>' + (S.isAdmin ? 'Add a movie and its showtimes in Admin, and it will appear here.' : 'Check back soon for new releases.') + '</p>' + (S.isAdmin ? '<button class="btn primary" data-go="admin">Go to Admin</button>' : '') + '</div>';
    return;
  }
  const f = ms[0];
  const venues = ((f.schedule && f.schedule.theatreIds) || []).filter(theatreById).length;
  main().innerHTML =
    (S.store.mode === 'demo' ? '<div class="notice" style="margin-bottom:22px">Demo mode: the sample catalogue, your edits and your bookings are saved in this browser only. Seats shown as booked are sample occupancy.</div>' : '') +
    '<section class="feature"><div class="feature-screen" id="featScreen"></div><div>' +
    '<div class="eyebrow">Now showing · ' + venues + ' screen' + (venues === 1 ? '' : 's') + '</div><h1>' + esc(f.title) + '</h1>' + metaHTML(f) +
    '<p class="syn">' + esc(f.synopsis || '') + '</p><button class="btn primary" data-movie="' + esc(f.id) + '">Book seats in 3D</button></div></section>' +
    '<div class="section-head"><h2>Now showing</h2><span class="muted">' + ms.length + ' film' + (ms.length === 1 ? '' : 's') + '</span></div>' +
    '<div class="posters">' + ms.map(m => '<button class="poster-card" data-movie="' + esc(m.id) + '"><div class="poster"><img alt="" src="' + posterSrc(m) + '"></div><div><div class="t">' + esc(m.title) + '</div><div class="s">' + esc(m.cert || '') + ' · ' + esc(m.language || '') + ' · ' + esc(m.genre || '') + '</div></div></button>').join('') + '</div>';
  mountFeature($('#featScreen'), f);
}
function mountFeature(el, m) {
  const md = screenMedia(m);
  if (md.kind === 'video') { el.innerHTML = '<video autoplay muted loop playsinline src="' + esc(md.url) + '"></video>'; return; }
  if (md.kind === 'image') { el.innerHTML = '<img alt="" src="' + esc(md.url) + '">'; return; }
  const cv = document.createElement('canvas'); cv.width = 1100; cv.height = 500; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  let raf = 0, stopped = false;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  const loop = () => { if (stopped) return; md.draw(ctx, cv.width, cv.height, (performance.now() - t0) / 1000); if (!reduce) raf = requestAnimationFrame(loop); };
  loop();
  S.featureStop = () => { stopped = true; cancelAnimationFrame(raf); };
}

/* ================= movie page ================= */
function renderMovie() {
  const m = movieById(S.movieId);
  if (!m) { main().innerHTML = '<div class="empty"><h2>This movie is not available</h2><button class="btn" data-go="home">Back to movies</button></div>'; return; }
  const dates = datesFor(m);
  if (!S.date || !dates.includes(S.date)) S.date = dates[0] || null;
  const ths = ((m.schedule && m.schedule.theatreIds) || []).map(theatreById).filter(Boolean);
  const times = ((m.schedule && m.schedule.times) || []).slice().sort();
  let venues = '';
  if (m.status === 'hidden') venues = '<div class="notice">Booking for this movie is closed.</div>';
  else if (!dates.length || !ths.length || !times.length) venues = '<div class="empty">No shows are scheduled in the next week.</div>';
  else venues = '<div class="venues">' + ths.map(t => {
    const info = computeSeats(t);
    return '<div class="venue"><div><h3>' + esc(t.name) + '</h3><div class="addr">' + esc([t.address, t.city].filter(Boolean).join(', ')) + '</div><div class="tiers">' +
      (t.tiers || []).map(x => esc(x.name) + ' ' + inr(x.price)).join(' · ') + '</div></div><span class="muted mono" style="font-size:12px">' + info.seats.length + ' seats</span>' +
      '<div class="times">' + times.map(tm => '<button class="time" data-show="' + esc(t.id) + '|' + tm + '"' + (timePassed(S.date, tm) ? ' disabled title="Show already started"' : '') + '>' + fmtTime(tm) + '</button>').join('') + '</div></div>';
  }).join('') + '</div>';
  main().innerHTML = '<button class="back-link" data-go="home">' + ICON.back.replace('<svg', '<svg width="16" height="16"') + 'All movies</button>' +
    '<section class="movie-head"><div class="poster"><img alt="" src="' + posterSrc(m) + '"></div><div><div class="eyebrow">' + esc(m.language || '') + ' · ' + esc(m.genre || '') + '</div><h1>' + esc(m.title) + '</h1>' + metaHTML(m) + '<p class="syn">' + esc(m.synopsis || '') + '</p></div></section>' +
    (dates.length ? '<div class="dates" role="group" aria-label="Show date">' + dates.map(d => { const dt = parseISO(d); return '<button class="date" data-date="' + d + '" aria-pressed="' + (d === S.date) + '"><span class="dw">' + dt.toLocaleDateString('en-IN', { weekday: 'short' }) + '</span><span class="dd">' + dt.getDate() + '</span><span class="dm">' + dt.toLocaleDateString('en-IN', { month: 'short' }) + '</span></button>'; }).join('') + '</div>' : '') +
    venues;
}

/* ================= seat count dialog ================= */
function openCount(show, initial) {
  const t = theatreById(show.theatreId), m = movieById(show.movieId);
  let n = initial || prefs('count') || 2;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const draw = () => {
    scrim.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cntT"><div><div class="eyebrow">' + esc(m.title) + ' · ' + fmtDate(show.date) + ' · ' + fmtTime(show.time) + '</div><h2 id="cntT">How many seats?</h2></div>' +
      '<div class="count-grid">' + Array.from({ length: MAX_SEATS }, (_, i) => '<button data-n="' + (i + 1) + '" aria-pressed="' + (i + 1 === n) + '">' + (i + 1) + '</button>').join('') + '</div>' +
      '<div class="tier-list">' + (t.tiers || []).map(x => '<div><span>' + esc(x.name) + (x.style === 'recliner' ? ' <span class="muted">(recliner)</span>' : '') + '</span><span class="mono">' + inr(x.price) + '</span></div>').join('') + '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" data-ok>Choose ' + n + ' seat' + (n > 1 ? 's' : '') + ' in 3D</button></div></div>';
  };
  draw();
  scrim.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (e.target === scrim || (b && b.hasAttribute('data-x'))) { scrim.remove(); return; }
    if (!b) return;
    if (b.dataset.n) { n = Number(b.dataset.n); draw(); $('[data-ok]', scrim).focus(); }
    if (b.hasAttribute('data-ok')) {
      prefs('count', n); scrim.remove();
      const st = S.stage;
      if (st && st.show.id === show.id) { st.count = n; st.selected = st.selected.slice(-n); buildPanel(); refreshStage(); }
      else openStage(show, n, initialSelection(show, n));
    }
  });
  scrim.addEventListener('keydown', e => { if (e.key === 'Escape') scrim.remove(); });
  document.body.appendChild(scrim);
  $('[data-ok]', scrim).focus();
}
function initialSelection(show, n) {
  if (S.stage && S.stage.show.id === show.id) return S.stage.selected.slice(0, n);
  if (S.order && S.order.show.id === show.id) return S.order.seats.map(s => s.id).slice(0, n);
  return [];
}

/* ================= 3D seat stage ================= */
function openStage(show, count, selected) {
  closeStage();
  const t = theatreById(show.theatreId), m = movieById(show.movieId);
  if (!t || !m) { toast('This show is no longer available.'); return; }
  const info = computeSeats(t);
  const st = S.stage = { lastPreset: 'overview', show: show, count: count, selected: (selected || []).slice(), taken: {}, info: info, theatre: t, movie: m, hall: null, sound: false };
  const root = $('#stageRoot');
  root.innerHTML =
    '<div class="stage" id="stage"><div class="stage-3d" id="hall3d">' +
    '<div class="stage-bar"><button class="icon-btn" data-st="close" aria-label="Back to showtimes">' + ICON.back + '</button><div class="title"><b>' + esc(m.title) + '</b><span>' + esc(t.name) + ' · ' + fmtDate(show.date) + ' · ' + fmtTime(show.time) + '</span></div></div>' +
    '<div class="seatview-chip" id="svChip" hidden></div>' +
    '<div class="tooltip" id="tip" hidden></div>' +
    '<div class="cam-dock"><div class="fly-pad" id="flyPad" hidden><span></span><button data-hold="0,0,1" aria-label="Move forward">' + ICON.up + '</button><button data-hold="0,1,0" aria-label="Move up" title="Up">' + ICON.plus + '</button><button data-hold="-1,0,0" aria-label="Move left">' + ICON.left + '</button><button data-hold="0,0,-1" aria-label="Move back">' + ICON.down + '</button><button data-hold="1,0,0" aria-label="Move right">' + ICON.right + '</button></div>' +
    '<div class="seg" id="camSeg"><button data-cam="overview" aria-pressed="true">' + ICON.cube + 'Overview</button><button data-cam="back">Back row</button><button data-cam="front">Front</button><button data-cam="top">Top</button><button data-cam="fly">' + ICON.plane + 'Fly</button></div>' +
    '<div class="hint desk" id="camHint"></div></div>' +
    '<div class="zoom-dock"><button class="icon-btn" data-st="zin" aria-label="Zoom in">' + ICON.plus + '</button><button class="icon-btn" data-st="zout" aria-label="Zoom out">' + ICON.minus + '</button><button class="icon-btn" data-st="sound" id="soundBtn" aria-label="Turn trailer sound on" hidden>' + ICON.mute + '</button></div>' +
    '</div><aside class="panel"><div class="panel-scroll" id="panelScroll"></div><div class="panel-foot" id="panelFoot"></div></aside></div>';
  document.body.style.overflow = 'hidden';
  buildPanel();
  try {
    st.hall = new Hall($('#hall3d'), {
      onSeatClick: s => toggleSeat(s.id),
      onSeatDouble: s => { if (!st.selected.includes(s.id) && !st.taken[s.id]) toggleSeat(s.id); st.hall.viewFromSeat(s.id); },
      onHover: (s, e) => showTip(s, e),
      onModeChange: (mode, seat) => onCamMode(mode, seat)
    });
    $('#hall3d').prepend(st.hall.renderer.domElement);
    st.hall.build(t);
    st.hall.setMedia(screenMedia(m));
    $('#soundBtn').hidden = !st.hall.hasVideo;
  } catch (e) {
    console.error(e);
    st.hall = null;
    $('#hall3d').insertAdjacentHTML('beforeend', '<div class="loader" style="position:absolute;inset:0"><p style="max-width:40ch">3D isn\'t available in this browser. Use the seat map in the panel to pick your seats.</p></div>');
    $('.panel .minimap-wrap') && ($('.panel .minimap-wrap').style.display = 'block');
  }
  onCamMode('orbit', null);
  st.unsub = S.store.watchSeatmap(show.id, taken => {
    st.taken = taken;
    const lost = st.selected.filter(id => taken[id]);
    if (lost.length) { st.selected = st.selected.filter(id => !taken[id]); toast(lost.join(', ') + ' was just booked by someone else.'); }
    refreshStage();
  });
  refreshStage();
  root.onclick = onStageClick;
  root.onpointerdown = e => { const b = e.target.closest('[data-hold]'); if (b && st.hall) { const v = b.dataset.hold.split(',').map(Number); st.hall.hold = { x: v[0], y: v[1], z: v[2] }; b.setPointerCapture(e.pointerId); } };
  const stop = () => { if (st.hall) st.hall.hold = null; };
  root.onpointerup = stop; root.onpointercancel = stop;
  root.onkeydown = e => { if (e.key === 'Escape' && st.hall && st.hall.mode === 'fp') st.hall.preset('overview'); };
}
function closeStage() {
  const st = S.stage; if (!st) return;
  if (st.unsub) st.unsub();
  if (st.hall) st.hall.dispose();
  $('#stageRoot').innerHTML = '';
  document.body.style.overflow = '';
  S.stage = null;
}
function buildPanel() {
  const st = S.stage, info = st.info;
  const cols = info.cols;
  const mm = info.rows.map((r, ri) => {
    let cells = '';
    let n = 0;
    for (let c = 0; c < cols; c++) {
      if ((r.cells || '')[c] === 'S') { n++; const id = r.label + n; cells += '<button class="mm-seat" data-seat="' + id + '" aria-label="Seat ' + id + '"></button>'; }
      else cells += '<span class="mm-gap"></span>';
    }
    return '<div class="mm-row"><span class="lbl">' + esc(r.label) + '</span><div class="mm-cells" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + cells + '</div><span class="lbl">' + esc(r.label) + '</span></div>';
  }).join('');
  $('#panelScroll').innerHTML =
    '<div class="legend"><span><i class="sw av"></i>Available</span><span><i class="sw se"></i>Your seats</span><span><i class="sw bo"></i>Booked</span></div>' +
    '<div><div class="progress"><span class="eyebrow">Seats chosen</span><span><b id="pCount">0</b> <span class="muted">/ ' + st.count + '</span></span></div><div class="pips" id="pips" style="margin-top:8px"></div></div>' +
    '<div class="chips" id="selChips"></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-st="best">' + ICON.spark + 'Pick best seats</button><button class="btn sm ghost" data-st="count">Change number (' + st.count + ')</button></div>' +
    '<div class="tier-rows">' + (st.theatre.tiers || []).map(x => { const rows = info.rows.filter(r => r.tier === x.id).map(r => r.label); return '<div><span>' + esc(x.name) + ' <span class="muted mono" style="font-size:12px">' + (rows.length ? esc(rows[0] + (rows.length > 1 ? '–' + rows[rows.length - 1] : '')) : '') + '</span></span><span class="mono">' + inr(x.price) + '</span></div>'; }).join('') + '</div>' +
    '<div class="minimap-wrap"><div class="eyebrow" style="margin-bottom:8px">Seat map</div><div class="minimap"><div class="mm-screen"></div>' + mm + '</div></div>';
}
function seatStates() {
  const st = S.stage, out = {};
  Object.keys(st.taken).forEach(k => { out[k] = 'booked'; });
  st.selected.forEach(k => { out[k] = 'selected'; });
  return out;
}
function refreshStage() {
  const st = S.stage; if (!st) return;
  const states = seatStates();
  if (st.hall) { st.hall.setStates(states); st.hall.setTags(st.selected); }
  $$('.mm-seat', $('#panelScroll')).forEach(b => { const s = states[b.dataset.seat]; b.className = 'mm-seat' + (s ? ' ' + s : ''); });
  $('#pCount').textContent = st.selected.length;
  $('#pips').innerHTML = Array.from({ length: st.count }, (_, i) => '<i class="pip' + (i < st.selected.length ? ' on' : '') + '"></i>').join('');
  const byId = {}; st.info.seats.forEach(s => { byId[s.id] = s; });
  $('#selChips').innerHTML = st.selected.length ? st.selected.map(id => '<span class="chip">' + esc(id) + '<button data-view="' + id + '" aria-label="View from ' + id + '" title="View from this seat">' + ICON.eye + '</button><button data-rm="' + id + '" aria-label="Remove ' + id + '">' + ICON.x + '</button></span>').join('') : '<span class="muted" style="font-size:13px">Click any blue seat in the hall or on the map. Double-click a seat to sit in it.</span>';
  const seats = st.selected.map(id => byId[id]).filter(Boolean);
  const p = priceOf(seats);
  const left = st.count - seats.length;
  $('#panelFoot').innerHTML = '<div class="sum-line"><span>' + seats.length + ' ticket' + (seats.length === 1 ? '' : 's') + '</span><span class="mono">' + inr(p.sub) + '</span></div>' +
    '<div class="sum-line"><span>Convenience fee + GST</span><span class="mono">' + inr(p.fee + p.gst) + '</span></div>' +
    '<div class="sum-total"><span class="eyebrow">Total</span><b>' + inr(p.total) + '</b></div>' +
    '<button class="btn primary" data-st="proceed"' + (left ? ' disabled' : '') + '>' + (left ? 'Select ' + left + ' more seat' + (left > 1 ? 's' : '') : 'Proceed to pay ' + inr(p.total)) + '</button>';
}
function toggleSeat(id) {
  const st = S.stage; if (!st) return;
  if (st.taken[id]) { toast(id + ' is already booked.'); return; }
  const i = st.selected.indexOf(id);
  if (i >= 0) st.selected.splice(i, 1);
  else {
    if (st.selected.length >= st.count) { const dropped = st.selected.shift(); if (st.count > 1) toast('Swapped ' + dropped + ' for ' + id + '. You asked for ' + st.count + ' seats.'); }
    st.selected.push(id);
  }
  if (st.hall) st.hall.setFocus(st.selected[st.selected.length - 1] || null);
  refreshStage();
}
function pickBest() {
  const st = S.stage, n = st.count, info = st.info;
  const nRows = info.rows.length;
  const ideal = nRows * 0.62, mid = (info.cols - 1) / 2;
  let best = null;
  info.rows.forEach((r, ri) => {
    const rowSeats = info.seats.filter(s => s.rowIdx === ri);
    for (let k = 0; k + n <= rowSeats.length; k++) {
      const run = rowSeats.slice(k, k + n);
      let ok = run.every(s => !st.taken[s.id]);
      for (let j = 1; ok && j < run.length; j++) if (run[j].col - run[j - 1].col !== 1) ok = false;
      if (!ok) continue;
      const cx = (run[0].col + run[run.length - 1].col) / 2;
      const score = Math.abs(cx - mid) * 0.8 + Math.abs(ri - ideal) * 1.4;
      if (!best || score < best.score) best = { score: score, ids: run.map(s => s.id) };
    }
  });
  if (!best) {
    const free = info.seats.filter(s => !st.taken[s.id]).sort((a, b) => (Math.abs(a.col - mid) * 0.8 + Math.abs(a.rowIdx - ideal) * 1.4) - (Math.abs(b.col - mid) * 0.8 + Math.abs(b.rowIdx - ideal) * 1.4));
    if (free.length < n) { toast('Only ' + free.length + ' seats are left for this show.'); return; }
    best = { ids: free.slice(0, n).map(s => s.id) };
    toast('No ' + n + ' seats together, so these are the best single seats.');
  }
  st.selected = best.ids;
  if (st.hall) { st.hall.setFocus(best.ids[Math.floor(best.ids.length / 2)]); if (st.hall.mode !== 'orbit') st.hall.preset('overview'); }
  refreshStage();
}
function showTip(s, e) {
  const tip = $('#tip'); if (!tip) return;
  if (!s || !e) { tip.hidden = true; return; }
  const st = S.stage, state = st.taken[s.id] ? 'Booked' : st.selected.includes(s.id) ? 'Selected' : 'Available';
  const r = $('#hall3d').getBoundingClientRect();
  tip.innerHTML = '<b>' + esc(s.id) + '</b> · Row ' + esc(s.row) + ', seat ' + s.num + '<br><span class="muted">' + esc(s.tier.name) + ' · ' + inr(s.price) + ' · ' + state + '</span>';
  tip.style.left = Math.min(e.clientX - r.left, r.width - 200) + 'px';
  tip.style.top = Math.min(e.clientY - r.top, r.height - 70) + 'px';
  tip.hidden = false;
}
function onCamMode(mode, seat) {
  const st = S.stage; if (!st) return;
  $('#flyPad').hidden = mode !== 'fp';
  const chip = $('#svChip');
  if (mode === 'fp') {
    chip.hidden = false;
    chip.innerHTML = (seat ? 'Viewing from <b class="mono">' + esc(seat) + '</b>' : 'Fly mode') + '<button class="btn sm" data-cam="overview">Exit</button>';
  } else chip.hidden = true;
  $$('#camSeg [data-cam]').forEach(b => b.setAttribute('aria-pressed', String((mode === 'fp' && b.dataset.cam === 'fly' && !seat) || (mode === 'orbit' && b.dataset.cam === st.lastPreset))));
  $('#camHint').innerHTML = mode === 'fp'
    ? 'Drag to look · <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move · <kbd>Q</kbd><kbd>E</kbd> down/up · <kbd>Esc</kbd> exit'
    : 'Drag to orbit · Scroll to zoom · Right-drag to pan · Double-click a seat to sit in it';
}
function onStageClick(e) {
  const st = S.stage; if (!st) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.seat) { toggleSeat(b.dataset.seat); return; }
  if (b.dataset.rm) { toggleSeat(b.dataset.rm); return; }
  if (b.dataset.view) { if (st.hall) st.hall.viewFromSeat(b.dataset.view); return; }
  if (b.dataset.cam) {
    if (!st.hall) return;
    if (b.dataset.cam === 'fly') st.hall.fly();
    else { st.lastPreset = b.dataset.cam; st.hall.preset(b.dataset.cam); }
    return;
  }
  const a = b.dataset.st;
  if (a === 'close') { closeStage(); return; }
  if (a === 'zin' && st.hall) st.hall.zoom(1);
  if (a === 'zout' && st.hall) st.hall.zoom(-1);
  if (a === 'sound' && st.hall) { st.sound = !st.sound; st.hall.setSound(st.sound); b.innerHTML = st.sound ? ICON.sound : ICON.mute; b.setAttribute('aria-label', st.sound ? 'Mute trailer' : 'Turn trailer sound on'); }
  if (a === 'best') pickBest();
  if (a === 'count') { const show = st.show; openCount(show, st.count); }
  if (a === 'proceed') {
    const byId = {}; st.info.seats.forEach(s => { byId[s.id] = s; });
    const seats = st.selected.map(id => byId[id]);
    S.order = { show: st.show, count: st.count, seats: seats, price: priceOf(seats) };
    closeStage(); S.sub = 'checkout'; render(); window.scrollTo(0, 0);
  }
}

/* ================= checkout ================= */
let payMethod = 'upi';
function renderCheckout() {
  const o = S.order, m = movieById(o.show.movieId), t = theatreById(o.show.theatreId);
  if (!m || !t) { S.sub = null; return render(); }
  const c = prefs('contact') || {};
  const methods = [['upi', 'UPI', 'GPay, PhonePe, Paytm', ICON.upi], ['card', 'Card', 'Credit or debit', ICON.card], ['net', 'Net banking', 'All major banks', ICON.bank], ['wallet', 'Wallet', 'Prepaid wallets', ICON.wallet]];
  const p = o.price;
  main().innerHTML = '<button class="back-link" data-act="reopen">' + ICON.back.replace('<svg', '<svg width="16" height="16"') + 'Back to seats</button>' +
    '<div class="checkout"><form class="card" id="payForm" novalidate><h2>Contact and payment</h2><div class="form-grid">' +
    '<div class="field full"><label for="cName">Full name</label><input id="cName" autocomplete="name" value="' + esc(c.name || '') + '" required></div>' +
    '<div class="field"><label for="cPhone">Mobile number</label><input id="cPhone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" value="' + esc(c.phone || '') + '" required></div>' +
    '<div class="field"><label for="cEmail">Email <span class="muted">(optional)</span></label><input id="cEmail" type="email" autocomplete="email" value="' + esc(c.email || '') + '"></div>' +
    '<div class="field full"><label>Payment method</label><div class="pay-opts" role="group" aria-label="Payment method">' + methods.map(x => '<button type="button" class="pay-opt" data-pay="' + x[0] + '" aria-pressed="' + (payMethod === x[0]) + '">' + x[3] + '<div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></button>').join('') + '</div></div>' +
    '<div class="full notice">No payment gateway is connected yet. Pressing Pay confirms the booking without charging anything.</div>' +
    '<div class="full" id="payErr"></div>' +
    '<div class="full"><button class="btn primary" id="payBtn" type="submit" style="width:100%;padding:13px">Pay ' + inr(p.total) + '</button></div></div></form>' +
    '<aside class="card"><div class="mini-poster" style="margin-bottom:16px"><div class="poster"><img alt="" src="' + posterSrc(m) + '"></div><div><div class="eyebrow">' + esc(m.cert || '') + ' · ' + esc(m.language || '') + '</div><h2 style="font-size:26px;margin:4px 0 6px">' + esc(m.title) + '</h2><div class="muted" style="font-size:13px">' + esc(t.name) + '<br>' + fmtDate(o.show.date, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + fmtTime(o.show.time) + '</div></div></div>' +
    '<div class="chips" style="margin-bottom:16px">' + o.seats.map(s => '<span class="chip" style="padding-right:9px">' + esc(s.id) + ' <span class="muted" style="font-family:var(--f-body);font-size:12px">' + esc(s.tier.name) + '</span></span>').join('') + '</div>' +
    '<div style="display:grid;gap:6px">' + summarise(o.seats).map(r => '<div class="sum-line"><span>' + r.n + ' × ' + esc(r.name) + ' @ ' + inr(r.price) + '</span><span class="mono">' + inr(r.n * r.price) + '</span></div>').join('') +
    '<div class="sum-line"><span>Convenience fee (' + inr(FEE) + ' × ' + o.seats.length + ')</span><span class="mono">' + inr(p.fee) + '</span></div><div class="sum-line"><span>GST on fee (18%)</span><span class="mono">' + inr(p.gst) + '</span></div>' +
    '<div class="sum-total" style="border-top:1px solid var(--line);padding-top:10px;margin-top:4px"><span class="eyebrow">Amount payable</span><b>' + inr(p.total) + '</b></div></div></aside></div>';
}
function summarise(seats) {
  const m = {};
  seats.forEach(s => { const k = s.tier.id; m[k] = m[k] || { name: s.tier.name, price: s.price, n: 0 }; m[k].n++; });
  return Object.values(m);
}
async function submitPay() {
  const name = $('#cName').value.trim(), phone = $('#cPhone').value.replace(/\D/g, ''), email = $('#cEmail').value.trim();
  const err = $('#payErr');
  const problems = [];
  if (!name) problems.push('Enter the name the tickets should be under.');
  if (!/^[6-9]\d{9}$/.test(phone.slice(-10)) || phone.length < 10) problems.push('Enter a 10-digit mobile number.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push('Check the email address, or leave it empty.');
  if (problems.length) { err.innerHTML = '<div class="notice err">' + problems.map(esc).join('<br>') + '</div>'; return; }
  err.innerHTML = '';
  prefs('contact', { name: name, phone: phone.slice(-10), email: email });
  const btn = $('#payBtn'); btn.disabled = true; btn.textContent = 'Confirming your seats…';
  const o = S.order, m = movieById(o.show.movieId), t = theatreById(o.show.theatreId);
  const record = {
    showId: o.show.id, movieId: m.id, theatreId: t.id, movieTitle: m.title, theatreName: t.name,
    date: o.show.date, time: o.show.time, seats: o.seats.map(s => s.id),
    lines: summarise(o.seats), subtotal: o.price.sub, fee: o.price.fee, gst: o.price.gst, total: o.price.total,
    name: name, phone: phone.slice(-10), email: email, payMethod: payMethod, payStatus: 'not-charged', status: 'confirmed', createdAt: new Date().toISOString()
  };
  const res = await S.store.book({ showId: o.show.id, theatreId: t.id, seats: record.seats, record: record });
  if (!res.ok) {
    btn.disabled = false; btn.textContent = 'Pay ' + inr(o.price.total);
    err.innerHTML = '<div class="notice err">' + esc(res.msg) + (res.clash ? ' <button type="button" class="btn sm" data-act="reopen" style="margin-left:6px">Pick other seats</button>' : '') + '</div>';
    if (res.clash) S.order.seats = S.order.seats.filter(s => !res.clash.includes(s.id));
    return;
  }
  S.lastBooking = res.booking; S.order = null; S.sub = 'ticket'; render(); window.scrollTo(0, 0);
}

/* ================= ticket + my tickets ================= */
function codeGrid(id) {
  const r = rng(hashStr(id)); let h = '';
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const fin = (a, b) => x >= a && x < a + 3 && y >= b && y < b + 3;
    const on = fin(0, 0) || fin(8, 0) || fin(0, 8) ? !(x % 8 === 1 && y % 8 === 1) : r() > 0.52;
    h += '<i' + (on ? '' : ' class="o"') + '></i>';
  }
  return '<div class="code-grid" aria-hidden="true">' + h + '</div>';
}
function ticketHTML(b) {
  return '<div class="ticket"><div class="ticket-main"><div class="eyebrow" style="color:#6b6556">Seatline · E-ticket</div><h2>' + esc(b.movieTitle) + '</h2>' +
    '<div class="kv"><div><div class="k">Date</div><div class="v">' + fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '</div></div><div><div class="k">Time</div><div class="v">' + fmtTime(b.time) + '</div></div><div><div class="k">Seats</div><div class="v mono">' + esc((b.seats || []).join(', ')) + '</div></div>' +
    '<div style="grid-column:span 2"><div class="k">Theatre</div><div class="v">' + esc(b.theatreName) + '</div></div><div><div class="k">Paid</div><div class="v">' + inr(b.total) + '</div></div>' +
    '<div style="grid-column:span 2"><div class="k">Name</div><div class="v">' + esc(b.name) + '</div></div><div><div class="k">Status</div><div class="v">' + (b.status === 'cancelled' ? 'Cancelled' : 'Confirmed') + '</div></div></div></div>' +
    '<div class="ticket-stub">' + codeGrid(b.id) + '<div class="mono">' + esc(b.id) + '</div><div style="font-size:11px;color:#6b6556;text-align:center">Show at entry</div></div></div>';
}
function renderTicket(b, fresh) {
  main().innerHTML = (fresh ? '<div class="eyebrow" style="color:var(--ok)">Booking confirmed</div><h1 style="font-size:clamp(36px,6vw,56px);margin:6px 0 22px">You\'re in. Enjoy the show.</h1>' : '<button class="back-link" data-go="tickets">' + ICON.back.replace('<svg', '<svg width="16" height="16"') + 'My tickets</button>') +
    ticketHTML(b) +
    '<p class="muted" style="margin:16px 0 22px;font-size:13px">Payment status: not charged (no gateway connected). ' + (b.email ? 'A confirmation would go to ' + esc(b.email) + ' once email is set up.' : '') + '</p>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-go="tickets">My tickets</button><button class="btn" data-go="home">Book another movie</button></div>';
}
function renderTickets() {
  const list = S.my.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!list.length) {
    main().innerHTML = '<div class="section-head"><h2>My tickets</h2></div><div class="empty"><p>' + (S.store.mode === 'live' && !S.store.uid ? 'Sign in to Claude to see your bookings.' : 'Your bookings will show up here.') + '</p><button class="btn primary" data-go="home">Browse movies</button></div>';
    return;
  }
  main().innerHTML = '<div class="section-head"><h2>My tickets</h2><span class="muted">' + list.length + ' booking' + (list.length > 1 ? 's' : '') + '</span></div><div class="tickets-list">' + list.map(b => {
    const m = movieById(b.movieId);
    return '<button class="booking-row" data-ticket="' + esc(b.id) + '" style="text-align:left;color:inherit"><div class="poster">' + (m ? '<img alt="" src="' + posterSrc(m) + '">' : '') + '</div><div style="min-width:0"><div style="font-weight:700">' + esc(b.movieTitle) + '</div><div class="muted" style="font-size:13px">' + esc(b.theatreName) + ' · ' + fmtDate(b.date) + ' · ' + fmtTime(b.time) + '</div><div class="mono" style="font-size:13px">' + esc((b.seats || []).join(', ')) + ' · ' + esc(b.id) + '</div></div><span class="status ' + (b.status === 'cancelled' ? 'x">Cancelled' : 'ok">Confirmed') + '</span></button>';
  }).join('') + '</div>';
}

/* ================= admin ================= */
function renderAdmin() {
  if (!S.isAdmin) { main().innerHTML = '<div class="empty"><h2>Admin is for the platform owner</h2><p>Ask the owner for Editor access to manage theatres and movies.</p></div>'; return; }
  if (S.editing) return S.editing.kind === 'theatre' ? renderTheatreEditor() : renderMovieEditor();
  const tabs = [['theatres', 'Theatres', S.theatres.length], ['movies', 'Movies', S.movies.length], ['bookings', 'Bookings', S.all.length]];
  let body = '';
  if (S.adminTab === 'theatres') {
    body = '<div class="section-head"><p class="muted">Each screen\'s seat layout is turned into a walkable 3D hall automatically.</p><button class="btn primary" data-act="newTheatre">' + ICON.plus + 'Add theatre</button></div>' +
      (S.theatres.length ? '<div class="admin-grid">' + S.theatres.slice().sort((a, b) => a.name.localeCompare(b.name)).map(t => {
        const n = computeSeats(t).seats.length;
        return '<div class="admin-card"><div><h3>' + esc(t.name) + '</h3><div class="muted" style="font-size:13px">' + esc([t.address, t.city].filter(Boolean).join(', ')) + '</div></div>' +
          '<div style="font-size:13px"><span class="mono">' + n + '</span> seats · ' + ((t.layout && t.layout.rows) || []).length + ' rows</div><div class="muted" style="font-size:13px">' + (t.tiers || []).map(x => esc(x.name) + ' ' + inr(x.price)).join(' · ') + '</div>' +
          '<div class="row"><button class="btn sm" data-act="editTheatre" data-id="' + esc(t.id) + '">Edit</button><button class="btn sm danger" data-act="delTheatre" data-id="' + esc(t.id) + '">Delete</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">No theatres yet. Add one to start scheduling shows.</div>');
  } else if (S.adminTab === 'movies') {
    body = '<div class="section-head"><p class="muted">Movies with a schedule open for booking as soon as you save them.</p><button class="btn primary" data-act="newMovie">' + ICON.plus + 'Add movie</button></div>' +
      (S.movies.length ? '<div class="admin-grid">' + S.movies.slice().sort((a, b) => a.title.localeCompare(b.title)).map(m => {
        const sc = m.schedule || {};
        const nth = (sc.theatreIds || []).filter(theatreById).length;
        return '<div class="admin-card"><div class="mini-poster"><div class="poster"><img alt="" src="' + posterSrc(m) + '"></div><div style="min-width:0"><h3>' + esc(m.title) + '</h3><div class="muted" style="font-size:13px">' + esc(m.language || '') + ' · ' + esc(m.cert || '') + ' · ' + fmtRun(Number(m.runtime)) + '</div>' +
          '<div style="margin-top:6px"><span class="status ' + (m.status === 'hidden' ? 'x">Booking closed' : 'ok">Open for booking') + '</span></div></div></div>' +
          '<div class="muted" style="font-size:13px">' + nth + ' theatre' + (nth === 1 ? '' : 's') + ' · ' + (sc.times || []).length + ' shows a day' + (sc.end ? ' · until ' + fmtDate(sc.end, { day: 'numeric', month: 'short' }) : '') + (m.media && m.media.ref ? ' · ' + (m.media.kind === 'video' ? 'trailer' : 'still') + ' on screen' : '') + '</div>' +
          '<div class="row"><button class="btn sm" data-act="editMovie" data-id="' + esc(m.id) + '">Edit</button><button class="btn sm" data-act="toggleMovie" data-id="' + esc(m.id) + '">' + (m.status === 'hidden' ? 'Open booking' : 'Close booking') + '</button><button class="btn sm danger" data-act="delMovie" data-id="' + esc(m.id) + '">Delete</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">No movies yet.</div>');
  } else {
    const ok = S.all.filter(b => b.status !== 'cancelled');
    const tix = ok.reduce((a, b) => a + (b.seats || []).length, 0);
    const gross = ok.reduce((a, b) => a + (b.subtotal || 0), 0);
    const list = S.all.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    body = '<div class="stat-row"><div><span class="eyebrow">Confirmed bookings</span><b class="mono">' + ok.length + '</b></div><div><span class="eyebrow">Tickets sold</span><b class="mono">' + tix + '</b></div><div><span class="eyebrow">Ticket revenue</span><b class="mono">' + inr(gross) + '</b></div></div>' +
      (list.length ? '<div class="table-wrap"><table class="bk"><thead><tr><th>Booking</th><th>Customer</th><th>Movie and show</th><th>Seats</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>' + list.map(b =>
        '<tr><td class="mono">' + esc(b.id) + '<div class="muted" style="font-size:12px">' + esc(new Date(b.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) + '</div></td><td>' + esc(b.name) + '<div class="muted mono" style="font-size:12px">' + esc(b.phone || '') + '</div></td><td>' + esc(b.movieTitle) + '<div class="muted" style="font-size:12px">' + esc(b.theatreName) + ' · ' + fmtDate(b.date) + ' · ' + fmtTime(b.time) + '</div></td><td class="mono">' + esc((b.seats || []).join(', ')) + '</td><td class="mono">' + inr(b.total) + '</td><td><span class="status ' + (b.status === 'cancelled' ? 'x">Cancelled' : 'ok">Confirmed') + '</span></td><td>' + (b.status === 'cancelled' ? '' : '<button class="btn sm danger" data-act="cancelBk" data-id="' + esc(b.id) + '">Cancel</button>') + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">No bookings yet.</div>');
  }
  main().innerHTML = '<div class="section-head"><h2>Admin</h2></div><div class="tabs" role="tablist">' + tabs.map(t => '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.adminTab === t[0]) + '">' + t[1] + ' <span class="muted mono">' + t[2] + '</span></button>').join('') + '</div>' + body;
}

/* ----- theatre editor ----- */
function newTheatreDraft() {
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push({ label: rowLabel(i), tier: i < 5 ? 'classic' : 'prime', cells: 'SSSS_SSSSSSSS_SSSS' });
  return { id: '', name: '', city: '', address: '', tiers: [{ id: 'classic', name: 'Classic', price: 180, style: 'standard' }, { id: 'prime', name: 'Prime', price: 250, style: 'standard' }], layout: { rows: rows } };
}
function renderTheatreEditor() {
  const E = S.editing, d = E.draft;
  const cols = Math.max(0, ...d.layout.rows.map(r => r.cells.length));
  const planUrl = d.plan ? S.store.mediaUrl(d.plan) : null;
  const canAuto = S.sampleImages && (E.planBlob || planUrl);
  const tierStyle = {}; d.tiers.forEach(t => { tierStyle[t.id] = t.style; });
  const seatsN = computeSeats(d).seats.length;
  main().innerHTML = '<div class="editor"><div class="editor-head"><div><button class="back-link" data-act="cancelEdit">' + ICON.back.replace('<svg', '<svg width="16" height="16"') + 'Theatres</button><h2>' + (E.isNew ? 'Add theatre' : 'Edit theatre') + '</h2></div><div class="row" style="display:flex;gap:8px">' + (E.isNew ? '' : '<button class="btn danger" data-act="delTheatre" data-id="' + esc(d.id) + '">Delete</button>') + '<button class="btn" data-act="cancelEdit">Cancel</button><button class="btn primary" data-act="saveTheatre">Save theatre</button></div></div>' +
    '<div id="edErr"></div>' +
    '<div class="editor-cols"><div class="card" style="display:grid;gap:14px"><h2 style="margin:0">Details</h2>' +
    '<div class="field"><label for="tName">Theatre and screen name</label><input id="tName" data-f="name" value="' + esc(d.name) + '" placeholder="e.g. Aurora Cinemas · Screen 4"></div>' +
    '<div class="form-grid"><div class="field"><label for="tCity">City</label><input id="tCity" data-f="city" value="' + esc(d.city) + '"></div><div class="field"><label for="tAddr">Address</label><input id="tAddr" data-f="address" value="' + esc(d.address) + '"></div></div>' +
    '<div class="field"><label>Floor plan</label><div class="upload">' + (planUrl ? '<img alt="Uploaded floor plan" src="' + esc(planUrl) + '">' : '<span class="muted" style="font-size:13px">Upload a photo or drawing of the seating plan.</span>') +
    (S.store.mode === 'live' && !S.canUpload ? '<span class="muted" style="font-size:13px">Uploading needs Editor access.</span>' : '<input type="file" id="planFile" accept="image/png,image/jpeg,image/webp">') +
    (canAuto ? '<button class="btn sm" data-act="readPlan">' + ICON.spark + 'Read seats from plan</button>' : '') + '<span class="muted" id="planStatus" style="font-size:12px">' + (S.sampleImages ? 'Claude can read the plan and draft the layout below. Check it before saving.' : 'Use the plan as a reference while you set rows and aisles below.') + '</span></div></div>' +
    '<div class="field"><label>Seat categories</label>' + d.tiers.map((t, i) => '<div class="tier-edit"><input aria-label="Category name" data-tier="' + i + '" data-tf="name" value="' + esc(t.name) + '"><input aria-label="Price in rupees" inputmode="numeric" data-tier="' + i + '" data-tf="price" value="' + esc(t.price) + '"><select aria-label="Seat style" data-tier="' + i + '" data-tf="style"><option value="standard"' + (t.style !== 'recliner' ? ' selected' : '') + '>Standard</option><option value="recliner"' + (t.style === 'recliner' ? ' selected' : '') + '>Recliner</option></select><button class="icon-btn" data-act="rmTier" data-i="' + i + '" aria-label="Remove category"' + (d.tiers.length < 2 ? ' disabled' : '') + '>' + ICON.x + '</button></div>').join('') +
    '<div><button class="btn sm" data-act="addTier">' + ICON.plus + 'Add category</button></div></div></div>' +
    '<div class="card" style="display:grid;gap:12px"><div class="section-head" style="margin:0"><h2 style="margin:0">3D preview</h2><span class="muted mono" style="font-size:13px">' + seatsN + ' seats</span></div><div class="preview3d" id="prev3d"></div><p class="muted" style="font-size:13px">This is the hall customers will walk through. It updates as you edit the layout.</p></div></div>' +
    '<div class="card"><div class="section-head"><h2 style="margin:0">Seat layout</h2><div class="seg" role="group" aria-label="Brush"><button data-brush="S" aria-pressed="' + (E.brush === 'S') + '">Paint seats</button><button data-brush="_" aria-pressed="' + (E.brush === '_') + '">Paint aisles</button></div></div>' +
    '<div class="grid-tools"><div class="field"><label for="gRows">Rows</label><input id="gRows" type="number" min="1" max="40" value="' + d.layout.rows.length + '"></div><div class="field"><label for="gCols">Seats across</label><input id="gCols" type="number" min="1" max="50" value="' + cols + '"></div><button class="btn" data-act="resize">Apply size</button><span class="muted" style="font-size:12px;align-self:center">Row A is nearest the screen. Letters I and O are skipped, as in most halls.</span></div>' +
    '<div class="layout-wrap"><div class="layout-screen" style="width:' + (cols * 23 + 140) + 'px">SCREEN</div>' + d.layout.rows.map((r, ri) =>
      '<div class="lrow"><span class="lbl">' + esc(r.label) + '</span><select aria-label="Row ' + esc(r.label) + ' category" data-rowtier="' + ri + '">' + d.tiers.map(t => '<option value="' + esc(t.id) + '"' + (t.id === r.tier ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select><div class="lcells" data-row="' + ri + '">' +
      Array.from({ length: cols }, (_, c) => '<button class="lcell' + (r.cells[c] === 'S' ? ' s' + (tierStyle[r.tier] === 'recliner' ? ' rec' : '') : '') + '" data-cell="' + ri + ',' + c + '" aria-label="Row ' + esc(r.label) + ' position ' + (c + 1) + (r.cells[c] === 'S' ? ', seat' : ', aisle') + '"></button>').join('') + '</div><span class="lbl">' + esc(r.label) + '</span></div>').join('') + '</div></div></div>';
  mountPreview();
}
function mountPreview() {
  const E = S.editing; const el = $('#prev3d'); if (!el) return;
  if (E.hall) { E.hall.dispose(); E.hall = null; }
  try {
    E.hall = new Hall(el, { compact: true });
    E.hall.build(E.draft);
    E.hall.setMedia({ kind: 'canvas', draw: (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1d2a4a'); g.addColorStop(1, '#3b2a55'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#e8e2d4'; ctx.textAlign = 'center'; ctx.font = '800 90px "Big Shoulders Display", sans-serif'; ctx.fillText((E.draft.name || 'Your screen').toUpperCase().slice(0, 28), w / 2, h / 2 + 30); } });
  } catch (e) { el.innerHTML = '<div class="loader" style="min-height:100%"><p>3D preview isn\'t available in this browser.</p></div>'; }
}
let prevTimer = 0;
function schedulePreview() {
  clearTimeout(prevTimer);
  prevTimer = setTimeout(() => { const E = S.editing; if (E && E.hall) E.hall.build(E.draft); const c = $('#prev3d'); if (c) { const n = computeSeats(E.draft).seats.length; const lab = c.parentElement.querySelector('.section-head .mono'); if (lab) lab.textContent = n + ' seats'; } }, 250);
}
function relabel(d) { d.layout.rows.forEach((r, i) => { r.label = rowLabel(i); }); }
function resizeLayout(rowsN, colsN) {
  const d = S.editing.draft;
  rowsN = Math.max(1, Math.min(40, rowsN | 0)); colsN = Math.max(1, Math.min(50, colsN | 0));
  const rows = d.layout.rows;
  while (rows.length < rowsN) rows.push({ label: '', tier: (rows[rows.length - 1] || {}).tier || d.tiers[0].id, cells: (rows[rows.length - 1] || {}).cells || 'S'.repeat(colsN) });
  rows.length = rowsN;
  rows.forEach(r => { r.cells = r.cells.length >= colsN ? r.cells.slice(0, colsN) : r.cells + 'S'.repeat(colsN - r.cells.length); });
  relabel(d);
}
async function readPlan() {
  const E = S.editing, st = $('#planStatus'), btn = $('[data-act="readPlan"]');
  let blob = E.planBlob;
  try {
    if (!blob) { const u = S.store.mediaUrl(E.draft.plan); blob = await (await fetch(u)).blob(); }
  } catch (e) { st.textContent = 'Could not open the uploaded plan. Upload it again.'; return; }
  btn.disabled = true; st.textContent = 'Reading the plan. This can take up to a minute…';
  const prompt = 'The image is a seating plan of a single cinema auditorium. Work out its seat layout.\n' +
    'Reply with only JSON in this shape: {"cols": 18, "rows": [{"cells": "SSSS_SSSSSSSSS_SSSS"}]}\n' +
    'Rules: list rows starting from the row NEAREST the screen. In each cells string, "S" is a seat and "_" is empty floor or an aisle, left to right as the audience faces the screen. ' +
    'Every cells string must be exactly cols characters long, and aisles should line up across rows. At most 40 rows and 50 cols. If you cannot see a seating plan, reply {"cols":0,"rows":[]}.';
  try {
    const out = await S.sample.json(prompt, { images: [blob], modelTier: 'complex' });
    const cols = Math.min(50, Number(out && out.cols) || 0);
    const rows = Array.isArray(out && out.rows) ? out.rows.slice(0, 40) : [];
    if (!cols || !rows.length) { st.textContent = 'No seating plan was found in that image. Set the layout by hand below.'; btn.disabled = false; return; }
    const d = E.draft, old = d.layout.rows;
    d.layout.rows = rows.map((r, i) => {
      let c = String((r && r.cells) || '').toUpperCase().replace(/[^S_]/g, '_');
      c = c.length >= cols ? c.slice(0, cols) : c + '_'.repeat(cols - c.length);
      return { label: '', tier: (old[i] || old[old.length - 1] || {}).tier || d.tiers[0].id, cells: c };
    });
    relabel(d);
    renderTheatreEditor();
    $('#planStatus').textContent = 'Layout drafted from the plan: ' + rows.length + ' rows. Check seats, aisles and categories before saving.';
  } catch (e) {
    const msg = { not_granted: 'Claude access was not allowed, so set the layout by hand.', rate_limited: 'Too many requests right now. Try again in a minute.', invalid_json: 'The plan could not be read reliably. Try a clearer image or set it by hand.', image_rejected: 'That image could not be used. Try a PNG or JPEG under 20 MB.' }[e && e.code] || 'The plan could not be read. Set the layout by hand below.';
    st.textContent = msg; btn.disabled = false;
  }
}
async function saveTheatre() {
  const d = S.editing.draft, err = $('#edErr');
  const probs = [];
  if (!d.name.trim()) probs.push('Give the theatre a name.');
  if (!computeSeats(d).seats.length) probs.push('The layout has no seats. Paint some seats first.');
  d.tiers.forEach(t => { if (!t.name.trim()) probs.push('Every seat category needs a name.'); if (!(Number(t.price) > 0)) probs.push('Set a price for ' + (t.name || 'each category') + '.'); });
  if (probs.length) { err.innerHTML = '<div class="notice err" style="margin-bottom:12px">' + probs.map(esc).join('<br>') + '</div>'; window.scrollTo(0, 0); return; }
  d.tiers.forEach(t => { t.price = Number(t.price); });
  if (!d.id) d.id = slug(d.name);
  try { await S.store.put('theatres', d); toast('Saved ' + d.name + '.'); closeEditor(); }
  catch (e) { err.innerHTML = '<div class="notice err">The theatre could not be saved (' + esc((e && e.code) || 'error') + ').</div>'; }
}
function closeEditor() { if (S.editing && S.editing.hall) S.editing.hall.dispose(); S.editing = null; render(); window.scrollTo(0, 0); }

/* ----- movie editor ----- */
function newMovieDraft() {
  const today = isoDate(new Date());
  return { id: '', title: '', language: 'Telugu', genre: '', cert: 'U/A 13+', runtime: 140, synopsis: '', status: 'showing', schedule: { theatreIds: S.theatres.slice(0, 1).map(t => t.id), times: ['10:30', '14:30', '18:30', '22:00'], start: today, end: addDays(today, 27) } };
}
function renderMovieEditor() {
  const E = S.editing, d = E.draft, sc = d.schedule;
  const posterUrl = d.poster ? S.store.mediaUrl(d.poster) : null;
  const mediaUrl = d.media && d.media.ref ? S.store.mediaUrl(d.media.ref) : null;
  const noUpload = S.store.mode === 'live' && !S.canUpload;
  main().innerHTML = '<div class="editor"><div class="editor-head"><div><button class="back-link" data-act="cancelEdit">' + ICON.back.replace('<svg', '<svg width="16" height="16"') + 'Movies</button><h2>' + (E.isNew ? 'Add movie' : 'Edit movie') + '</h2></div><div style="display:flex;gap:8px">' + (E.isNew ? '' : '<button class="btn danger" data-act="delMovie" data-id="' + esc(d.id) + '">Delete</button>') + '<button class="btn" data-act="cancelEdit">Cancel</button><button class="btn primary" data-act="saveMovie">' + (E.isNew ? 'Save and open booking' : 'Save movie') + '</button></div></div><div id="edErr"></div>' +
    '<div class="editor-cols"><div class="card" style="display:grid;gap:14px"><h2 style="margin:0">Details</h2>' +
    '<div class="field"><label for="mTitle">Title</label><input id="mTitle" data-mf="title" value="' + esc(d.title) + '"></div>' +
    '<div class="form-grid"><div class="field"><label for="mLang">Language</label><select id="mLang" data-mf="language">' + LANGS.map(l => '<option' + (l === d.language ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="mCert">Certificate</label><select id="mCert" data-mf="cert">' + CERTS.map(l => '<option' + (l === d.cert ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="mGenre">Genre</label><input id="mGenre" data-mf="genre" value="' + esc(d.genre) + '" placeholder="e.g. Action thriller"></div>' +
    '<div class="field"><label for="mRun">Runtime (minutes)</label><input id="mRun" data-mf="runtime" inputmode="numeric" value="' + esc(d.runtime) + '"></div></div>' +
    '<div class="field"><label for="mSyn">Synopsis</label><textarea id="mSyn" data-mf="synopsis">' + esc(d.synopsis) + '</textarea></div>' +
    '<label style="display:flex;gap:10px;align-items:center;font-size:14px"><input type="checkbox" id="mOpen"' + (d.status !== 'hidden' ? ' checked' : '') + '> Open for booking</label></div>' +
    '<div class="card" style="display:grid;gap:14px"><h2 style="margin:0">Poster and screen</h2>' +
    '<div class="field"><label>Poster</label><div class="upload">' + (posterUrl ? '<img alt="Poster" src="' + esc(posterUrl) + '">' : '<img alt="Generated poster" src="' + posterSrc(Object.assign({}, d, { id: d.id || d.title })) + '" style="max-height:160px"><span class="muted" style="font-size:12px">A title poster is generated until you upload one.</span>') + (noUpload ? '' : '<input type="file" id="posterFile" accept="image/png,image/jpeg,image/webp">') + (posterUrl ? '<button class="btn sm ghost" data-act="rmPoster">Remove poster</button>' : '') + '</div></div>' +
    '<div class="field"><label>Shown on the cinema screen while customers pick seats</label><div class="upload">' + (mediaUrl ? (d.media.kind === 'video' ? '<video src="' + esc(mediaUrl) + '" muted loop autoplay playsinline></video>' : '<img alt="Screen still" src="' + esc(mediaUrl) + '">') : '<span class="muted" style="font-size:13px">Upload a trailer clip (MP4 or WebM, up to 20 MB) or a wide still. Without one, the poster or an animated title card plays.</span>') +
    (noUpload ? '<span class="muted" style="font-size:13px">Uploading needs Editor access.</span>' : '<input type="file" id="mediaFile" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm">') + (mediaUrl ? '<button class="btn sm ghost" data-act="rmMedia">Remove</button>' : '') + '<span class="muted" id="upStatus" style="font-size:12px"></span></div></div></div></div>' +
    '<div class="card" style="display:grid;gap:14px"><h2 style="margin:0">Showtimes</h2><div class="editor-cols">' +
    '<div class="field"><label>Theatres</label><div class="check-list">' + (S.theatres.length ? S.theatres.map(t => '<label><input type="checkbox" data-th="' + esc(t.id) + '"' + (sc.theatreIds.includes(t.id) ? ' checked' : '') + '> ' + esc(t.name) + ' <span class="muted" style="font-size:12px">' + esc(t.city || '') + '</span></label>').join('') : '<span class="muted">Add a theatre first.</span>') + '</div></div>' +
    '<div style="display:grid;gap:14px"><div class="field"><label>Daily show times</label><div class="time-chips">' + sc.times.slice().sort().map(tm => '<span class="chip">' + fmtTime(tm) + '<button data-act="rmTime" data-t="' + tm + '" aria-label="Remove ' + fmtTime(tm) + '">' + ICON.x + '</button></span>').join('') + '<input type="time" id="newTime" style="background:var(--bg);border:1px solid var(--line);border-radius:7px;padding:5px 8px"><button class="btn sm" data-act="addTime">Add</button></div></div>' +
    '<div class="form-grid"><div class="field"><label for="mStart">From</label><input type="date" id="mStart" value="' + esc(sc.start) + '"></div><div class="field"><label for="mEnd">Until</label><input type="date" id="mEnd" value="' + esc(sc.end) + '"></div></div></div></div></div></div>';
}
async function handleUpload(file, kind) {
  const E = S.editing; if (!E) return;
  const st = $('#upStatus') || $('#planStatus');
  if (file.size > 20 * 1024 * 1024) { toast('That file is over 20 MB. Upload a smaller one.'); return; }
  if (st) st.textContent = 'Uploading ' + file.name + '…';
  try {
    const ref = await S.store.upload(file);
    if (kind === 'plan') { E.draft.plan = ref; E.planBlob = file; renderTheatreEditor(); }
    else if (kind === 'poster') { E.draft.poster = ref; renderMovieEditor(); }
    else { E.draft.media = { ref: ref, kind: file.type.startsWith('video/') ? 'video' : 'image' }; renderMovieEditor(); if (S.store.mode === 'demo' && file.type.startsWith('video/')) toast('Demo mode keeps uploaded videos only until you reload.'); }
  } catch (e) {
    const msg = { too_large: 'That file is too large.', unsupported_type: 'That file type is not supported. Use PNG, JPEG, WebP, MP4 or WebM.', quota_or_state: 'Storage for this platform is full.', not_granted: 'Uploading needs Editor access.' }[e && e.code] || 'The upload failed. Try again.';
    if (st) st.textContent = msg; toast(msg);
  }
}
async function saveMovie() {
  const d = S.editing.draft, err = $('#edErr');
  d.status = $('#mOpen').checked ? 'showing' : 'hidden';
  d.schedule.start = $('#mStart').value; d.schedule.end = $('#mEnd').value;
  const probs = [];
  if (!d.title.trim()) probs.push('Give the movie a title.');
  if (!(Number(d.runtime) > 0)) probs.push('Enter the runtime in minutes.');
  if (d.status !== 'hidden') {
    if (!d.schedule.theatreIds.length) probs.push('Pick at least one theatre.');
    if (!d.schedule.times.length) probs.push('Add at least one show time.');
    if (!d.schedule.start || !d.schedule.end || d.schedule.end < d.schedule.start) probs.push('Check the show dates.');
  }
  if (probs.length) { err.innerHTML = '<div class="notice err" style="margin-bottom:12px">' + probs.map(esc).join('<br>') + '</div>'; window.scrollTo(0, 0); return; }
  d.runtime = Number(d.runtime);
  if (!d.id) d.id = slug(d.title);
  if (!d.art) d.art = artOf(d);
  try { await S.store.put('movies', d); toast(d.status === 'hidden' ? 'Saved ' + d.title + '.' : d.title + ' is open for booking.'); closeEditor(); }
  catch (e) { err.innerHTML = '<div class="notice err">The movie could not be saved (' + esc((e && e.code) || 'error') + ').</div>'; }
}

/* ----- inline confirm for destructive actions ----- */
function confirmBtn(b, label, fn) {
  if (b.dataset.armed) { fn(); return; }
  b.dataset.armed = '1'; const old = b.innerHTML; b.textContent = label;
  setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.innerHTML = old; } }, 3500);
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const b = e.target.closest('button, [data-go]');
  if (!b || b.closest('#stageRoot') || b.closest('.scrim')) return;
  if (b.dataset.go) { go(b.dataset.go); return; }
  if (b.dataset.movie) { go('movie', b.dataset.movie); return; }
  if (b.dataset.date) { S.date = b.dataset.date; renderMovie(); return; }
  if (b.dataset.show) {
    const p = b.dataset.show.split('|');
    const show = { id: showIdOf(S.movieId, p[0], S.date, p[1]), movieId: S.movieId, theatreId: p[0], date: S.date, time: p[1] };
    openCount(show); return;
  }
  if (b.dataset.pay) { payMethod = b.dataset.pay; $$('[data-pay]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.pay === payMethod))); return; }
  if (b.dataset.ticket) { S.viewTicket = b.dataset.ticket; render(); window.scrollTo(0, 0); return; }
  if (b.dataset.tab) { S.adminTab = b.dataset.tab; renderAdmin(); return; }
  if (b.dataset.brush) { S.editing.brush = b.dataset.brush; $$('[data-brush]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.brush === S.editing.brush))); return; }
  const a = b.dataset.act; if (!a) return;
  const id = b.dataset.id;
  if (a === 'reopen') { const o = S.order; if (o) openStage(o.show, o.count || o.seats.length || 1, o.seats.map(s => s.id)); return; }
  if (a === 'newTheatre') { S.editing = { kind: 'theatre', draft: newTheatreDraft(), isNew: true, brush: 'S' }; renderAdmin(); return; }
  if (a === 'editTheatre') { S.editing = { kind: 'theatre', draft: Object.assign({ city: '', address: '' }, clone(theatreById(id))), isNew: false, brush: 'S' }; renderAdmin(); return; }
  if (a === 'delTheatre') { confirmBtn(b, 'Confirm delete', async () => { await S.store.remove('theatres', id); toast('Theatre deleted.'); closeEditor(); }); return; }
  if (a === 'newMovie') { S.editing = { kind: 'movie', draft: newMovieDraft(), isNew: true }; renderAdmin(); return; }
  if (a === 'editMovie') { const m = clone(movieById(id)); m.schedule = Object.assign({ theatreIds: [], times: [], start: isoDate(new Date()), end: addDays(isoDate(new Date()), 27) }, m.schedule || {}); S.editing = { kind: 'movie', draft: m, isNew: false }; renderAdmin(); return; }
  if (a === 'delMovie') { confirmBtn(b, 'Confirm delete', async () => { await S.store.remove('movies', id); toast('Movie deleted.'); closeEditor(); }); return; }
  if (a === 'toggleMovie') { const m = clone(movieById(id)); m.status = m.status === 'hidden' ? 'showing' : 'hidden'; S.store.put('movies', m).then(() => toast(m.status === 'hidden' ? 'Booking closed for ' + m.title + '.' : m.title + ' is open for booking.')); return; }
  if (a === 'cancelBk') { const bk = S.all.find(x => x.id === id); confirmBtn(b, 'Confirm', async () => { await S.store.cancel(bk); toast('Booking ' + id + ' cancelled and seats released.'); }); return; }
  if (a === 'cancelEdit') { closeEditor(); return; }
  if (a === 'saveTheatre') { saveTheatre(); return; }
  if (a === 'saveMovie') { saveMovie(); return; }
  if (a === 'addTier') { const d = S.editing.draft; d.tiers.push({ id: 't' + Math.random().toString(36).slice(2, 7), name: 'New category', price: 200, style: 'standard' }); renderTheatreEditor(); return; }
  if (a === 'rmTier') { const d = S.editing.draft; const t = d.tiers.splice(Number(b.dataset.i), 1)[0]; d.layout.rows.forEach(r => { if (r.tier === t.id) r.tier = d.tiers[0].id; }); renderTheatreEditor(); return; }
  if (a === 'resize') { resizeLayout(Number($('#gRows').value), Number($('#gCols').value)); renderTheatreEditor(); return; }
  if (a === 'readPlan') { readPlan(); return; }
  if (a === 'addTime') { const v = $('#newTime').value; const sc = S.editing.draft.schedule; if (v && !sc.times.includes(v)) { sc.times.push(v); renderMovieEditor(); } return; }
  if (a === 'rmTime') { const sc = S.editing.draft.schedule; sc.times = sc.times.filter(t => t !== b.dataset.t); renderMovieEditor(); return; }
  if (a === 'rmPoster') { delete S.editing.draft.poster; renderMovieEditor(); return; }
  if (a === 'rmMedia') { delete S.editing.draft.media; renderMovieEditor(); return; }
});
document.addEventListener('submit', e => { if (e.target.id === 'payForm') { e.preventDefault(); submitPay(); } });
document.addEventListener('input', e => {
  const el = e.target, E = S.editing; if (!E) return;
  if (el.dataset.f) { E.draft[el.dataset.f] = el.value; return; }
  if (el.dataset.mf) { E.draft[el.dataset.mf] = el.value; return; }
  if (el.id === 'mStart') { E.draft.schedule.start = el.value; return; }
  if (el.id === 'mEnd') { E.draft.schedule.end = el.value; return; }
  if (el.id === 'mOpen') { E.draft.status = el.checked ? 'showing' : 'hidden'; return; }
  if (el.dataset.tier) { const t = E.draft.tiers[Number(el.dataset.tier)]; t[el.dataset.tf] = el.dataset.tf === 'price' ? el.value.replace(/[^\d.]/g, '') : el.value; if (el.dataset.tf === 'style') renderTheatreEditor(); return; }
});
document.addEventListener('change', e => {
  const el = e.target, E = S.editing; if (!E) return;
  if (el.dataset.rowtier) { E.draft.layout.rows[Number(el.dataset.rowtier)].tier = el.value; renderTheatreEditor(); return; }
  if (el.dataset.th) { const ids = E.draft.schedule.theatreIds; if (el.checked) { if (!ids.includes(el.dataset.th)) ids.push(el.dataset.th); } else E.draft.schedule.theatreIds = ids.filter(x => x !== el.dataset.th); return; }
  if (el.dataset.tf === 'style') return;
  if (el.id === 'mOpen') { E.draft.status = el.checked ? 'showing' : 'hidden'; return; }
  if (el.id === 'planFile' && el.files[0]) handleUpload(el.files[0], 'plan');
  if (el.id === 'posterFile' && el.files[0]) handleUpload(el.files[0], 'poster');
  if (el.id === 'mediaFile' && el.files[0]) handleUpload(el.files[0], 'media');
});
// Layout painting: press and drag across cells
let painting = null;
document.addEventListener('pointerdown', e => {
  const c = e.target.closest('[data-cell]'); if (!c || !S.editing) return;
  e.preventDefault();
  painting = S.editing.brush || 'S';
  paintCell(c);
});
document.addEventListener('pointermove', e => {
  if (!painting) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const c = el && el.closest && el.closest('[data-cell]');
  if (c) paintCell(c);
});
document.addEventListener('pointerup', () => { painting = null; });
function paintCell(c) {
  const d = S.editing.draft; const p = c.dataset.cell.split(',').map(Number);
  const r = d.layout.rows[p[0]];
  if (r.cells[p[1]] === painting) return;
  r.cells = r.cells.slice(0, p[1]) + painting + r.cells.slice(p[1] + 1);
  const rec = (d.tiers.find(t => t.id === r.tier) || {}).style === 'recliner';
  c.className = 'lcell' + (painting === 'S' ? ' s' + (rec ? ' rec' : '') : '');
  schedulePreview();
}

/* ================= boot ================= */
async function boot() {
  readHash();
  try { await Promise.race([Promise.all(['900 40px "Big Shoulders Display"', '800 40px "Big Shoulders Display"', '600 16px "Figtree"'].map(f => document.fonts.load(f))), sleep(2500)]); } catch (e) {}
  let db = null, user = null;
  if (window.claude && typeof window.claude.use === 'function') {
    try { const r = await Promise.all([window.claude.use('db'), window.claude.use('user')]); db = r[0]; user = r[1]; } catch (e) { db = null; }
  }
  if (db) {
    const uid = user ? await user.id() : null;
    S.isAdmin = user ? await user.canEdit() : false;
    let assets = null;
    if (S.isAdmin) {
      try { assets = await window.claude.use('assets'); } catch (e) { assets = null; }
      try { S.sample = await window.claude.use('sample'); const lim = S.sample ? await S.sample.limits().catch(() => null) : null; S.sampleImages = !!(lim && lim.images); } catch (e) { S.sample = null; }
    }
    S.canUpload = !!assets;
    S.store = new LiveStore(db, assets, uid);
  } else {
    S.store = new DemoStore();
    S.isAdmin = true; S.canUpload = true;
  }
  const slowTimer = setTimeout(() => { if (!S.loaded) { S.slow = true; render(); } }, 10000);
  S.store.watchCatalog((ths, mvs) => {
    clearTimeout(slowTimer);
    S.theatres = ths; S.movies = mvs;
    const first = !S.loaded; S.loaded = true;
    if (first || (!S.editing && !S.stage && S.sub !== 'checkout')) render();
    else renderNav();
  }, () => { S.slow = true; if (!S.loaded) render(); });
  S.store.watchMyBookings(list => { S.my = list; if (S.loaded && S.route === 'tickets' && !S.sub) render(); });
  if (S.isAdmin) S.store.watchAllBookings(list => { S.all = list; if (S.loaded && S.route === 'admin' && !S.editing) render(); });
  render();
}
boot();
