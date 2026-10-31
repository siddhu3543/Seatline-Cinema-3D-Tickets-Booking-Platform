/* Hall: builds a 3D auditorium from a theatre layout and handles navigation + seat picking. */
const SEAT_RGB = {
  available: 0x5d7db3, availableHover: 0xa9c3f0,
  selected: 0xf2b33d, selectedHover: 0xffd98a,
  booked: 0x262933, bookedHover: 0x30333e
};

function computeSeats(theatre) {
  const tiers = {};
  (theatre.tiers || []).forEach(t => { tiers[t.id] = t; });
  const rows = (theatre.layout && theatre.layout.rows) || [];
  const seats = [];
  let cols = 0;
  rows.forEach(r => { cols = Math.max(cols, (r.cells || '').length); });
  rows.forEach((r, ri) => {
    let n = 0;
    const cells = r.cells || '';
    for (let c = 0; c < cells.length; c++) {
      if (cells[c] !== 'S') continue;
      n++;
      const tier = tiers[r.tier] || (theatre.tiers || [])[0] || { id: 'std', name: 'Standard', price: 150, style: 'standard' };
      seats.push({ id: r.label + n, row: r.label, num: n, rowIdx: ri, col: c, tierId: tier.id, tier: tier, price: Number(tier.price) || 0 });
    }
  });
  return { seats: seats, cols: cols, rows: rows, tiers: tiers };
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

class Hall {
  constructor(el, opts) {
    this.el = el;
    this.opts = opts || {};
    this.mode = 'orbit';
    this.states = {};
    this.hoverId = null;
    this.focusId = null;
    this.keys = {};
    this.anim = null;
    this.mediaTick = null;
    this.disposed = false;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.domElement.className = 'hall-canvas';
    r.domElement.tabIndex = 0;
    r.domElement.setAttribute('aria-label', '3D auditorium. Drag to look around, scroll to zoom, click a seat to select it.');
    el.appendChild(r.domElement);

    this.tagLayer = document.createElement('div');
    this.tagLayer.className = 'tag-layer';
    el.appendChild(this.tagLayer);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070b);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 500);
    this.controls = new THREE.OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.screenSpacePanning = true;

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.raycaster = new THREE.Raycaster();
    this.ptr = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this._onResize = () => this.resize();
    this.ro = new ResizeObserver(this._onResize);
    this.ro.observe(el);
    this.resize();
    this.bindInput();
    r.setAnimationLoop(() => this.frame());
  }

  resize() {
    const w = Math.max(1, this.el.clientWidth), h = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    this.camera.fov = w < 520 ? 55 : 42;
    this.camera.updateProjectionMatrix();
  }

  clearRoot() {
    const disposeObj = o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map && m.map !== this.screenTex) m.map.dispose(); m.dispose(); });
    };
    this.root.traverse(disposeObj);
    this.root.clear();
  }

  build(theatre) {
    this.clearRoot();
    const info = computeSeats(theatre);
    this.info = info;
    const P = 0.64, side = 1.6;
    const cols = Math.max(info.cols, 6);
    const W = cols * P + side * 2;
    const frontGap = Math.max(4.2, W * 0.42);
    const rowGeo = [];
    let z = frontGap, y = 0.12;
    info.rows.forEach((row, i) => {
      const tier = info.tiers[row.tier];
      const rec = tier && tier.style === 'recliner';
      const depth = rec ? 1.5 : 1.0;
      if (i > 0) y += rec ? 0.42 : 0.3;
      rowGeo.push({ z0: z, depth: depth, y: y, rec: rec, label: row.label });
      z += depth;
    });
    const zEnd = z, yLast = y;
    const D = zEnd + 2.4;
    const screenW = Math.min(W - 1.4, Math.max(7, W * 0.86));
    const screenH = screenW / 2.2;
    const screenBottom = 1.05;
    const H = Math.max(screenBottom + screenH + 1.4, yLast + 3.4);
    Object.assign(this, { W: W, D: D, H: H, P: P, screenW: screenW, screenH: screenH, screenBottom: screenBottom, rowGeo: rowGeo, cols: cols });
    const xOf = c => (c - (cols - 1) / 2) * P;

    // Room shell: back faces only, so the camera sees in from outside (cutaway) and all walls from inside.
    const wall = new THREE.MeshStandardMaterial({ color: 0x15161f, roughness: 0.95, side: THREE.BackSide });
    const ceil = new THREE.MeshStandardMaterial({ color: 0x0c0d13, roughness: 1, side: THREE.BackSide });
    const floor = new THREE.MeshStandardMaterial({ color: 0x1b1a22, roughness: 1, side: THREE.BackSide });
    const front = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 1, side: THREE.BackSide });
    const room = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [wall, wall, ceil, floor, wall, front]);
    room.position.set(0, H / 2, D / 2);
    this.root.add(room);

    // Acoustic panels and sconces on the side walls: single-sided planes facing into the room,
    // so they disappear with the wall when the camera looks in from outside.
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x20222f, roughness: 0.9 });
    const sconceMat = new THREE.MeshBasicMaterial({ color: 0xffb862 });
    const panelGeo = new THREE.PlaneGeometry(1.1, H * 0.55);
    const sconceGeo = new THREE.PlaneGeometry(0.12, 0.42);
    for (let pz = 2; pz < D - 1; pz += 1.6) {
      [-1, 1].forEach(s => {
        const p = new THREE.Mesh(panelGeo, panelMat);
        p.position.set(s * (W / 2 - 0.02), H * 0.5, pz);
        p.rotation.y = -s * Math.PI / 2;
        this.root.add(p);
      });
    }
    for (let sz = 3; sz < D - 1; sz += 3.2) {
      [-1, 1].forEach(s => {
        const m = new THREE.Mesh(sconceGeo, sconceMat);
        m.position.set(s * (W / 2 - 0.04), H * 0.82, sz);
        m.rotation.y = -s * Math.PI / 2;
        this.root.add(m);
      });
    }

    // Stage under the screen
    const stage = new THREE.Mesh(new THREE.BoxGeometry(W, 0.45, 1.3), new THREE.MeshStandardMaterial({ color: 0x101119, roughness: 0.9 }));
    stage.position.set(0, 0.225, 0.65);
    this.root.add(stage);

    // Risers and aisle step lights
    const riserMat = new THREE.MeshStandardMaterial({ color: 0x1d1c25, roughness: 0.95 });
    const stepMat = new THREE.MeshBasicMaterial({ color: 0xff9f3d });
    const stepGeo = new THREE.BoxGeometry(side * 0.7, 0.025, 0.04);
    rowGeo.forEach((g, i) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(W, g.y, g.depth), riserMat);
      box.position.set(0, g.y / 2, g.z0 + g.depth / 2);
      this.root.add(box);
      [-1, 1].forEach(s => {
        const st = new THREE.Mesh(stepGeo, stepMat);
        st.position.set(s * (W / 2 - side / 2), g.y + 0.013, g.z0 + 0.03);
        this.root.add(st);
      });
    });
    const walk = new THREE.Mesh(new THREE.BoxGeometry(W, yLast + 0.001, D - zEnd), riserMat);
    walk.position.set(0, (yLast + 0.001) / 2, zEnd + (D - zEnd) / 2);
    this.root.add(walk);

    // Screen: gently curved, with black masking
    const sg = new THREE.PlaneGeometry(screenW, screenH, 48, 1);
    const pos = sg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (screenW / 2);
      pos.setZ(i, x * x * screenW * 0.035);
    }
    pos.needsUpdate = true;
    this.screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: this.screenTex || null });
    const screen = new THREE.Mesh(sg, this.screenMat);
    this.screenY = screenBottom + screenH / 2;
    this.screenZ = 0.4;
    screen.position.set(0, this.screenY, this.screenZ);
    this.root.add(screen);
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(screenW + 0.9, screenH + 0.7), new THREE.MeshBasicMaterial({ color: 0x030304 }));
    mask.position.set(0, this.screenY, 0.3);
    this.root.add(mask);

    // Lighting
    this.root.add(new THREE.AmbientLight(0x8a92b8, 0.5));
    this.root.add(new THREE.HemisphereLight(0x9aa6ff, 0x1a120a, 0.35));
    const dl = new THREE.DirectionalLight(0xffffff, 0.35);
    dl.position.set(-W, H * 3, D);
    this.root.add(dl);
    this.screenLight = new THREE.PointLight(0xbfd0ff, 1.4, D * 1.6, 1.4);
    this.screenLight.position.set(0, this.screenY, 3.2);
    this.root.add(this.screenLight);
    [-1, 1].forEach(s => {
      const wl = new THREE.PointLight(0xffa860, 0.5, W * 1.2, 2);
      wl.position.set(s * (W / 2 - 0.6), H * 0.75, D * 0.55);
      this.root.add(wl);
    });

    // Projector beam from the booth window
    const apex = new THREE.Vector3(0, H - 0.7, D - 0.05);
    const sx = screenW / 2, sy0 = screenBottom, sy1 = screenBottom + screenH, sz = this.screenZ + 0.1;
    const c = [new THREE.Vector3(-sx, sy0, sz), new THREE.Vector3(sx, sy0, sz), new THREE.Vector3(sx, sy1, sz), new THREE.Vector3(-sx, sy1, sz)];
    const bv = [];
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; bv.push(apex.x, apex.y, apex.z, a.x, a.y, a.z, b.x, b.y, b.z); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bv, 3));
    const beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xc9d6ff, transparent: true, opacity: 0.028, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    this.root.add(beam);
    const booth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ color: 0xe8eeff }));
    booth.position.copy(apex).add(new THREE.Vector3(0, 0, -0.02));
    booth.rotation.y = Math.PI;
    this.root.add(booth);
    this.screenCorners = c;

    // Seats (instanced)
    const n = info.seats.length;
    const cushG = new THREE.ExtrudeGeometry(roundedRect(0.5, 0.46, 0.08), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 4 });
    cushG.rotateX(-Math.PI / 2); cushG.center();
    const backG = new THREE.ExtrudeGeometry(roundedRect(0.5, 0.6, 0.1), { depth: 0.09, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 4 });
    backG.center();
    const armG = new THREE.BoxGeometry(0.07, 0.5, 0.52);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.04 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0x0f1016, roughness: 0.7 });
    this.cush = new THREE.InstancedMesh(cushG, seatMat, Math.max(1, n));
    this.back = new THREE.InstancedMesh(backG, seatMat, Math.max(1, n));
    this.arms = new THREE.InstancedMesh(armG, armMat, Math.max(1, n * 2));
    this.cush.count = n; this.back.count = n; this.arms.count = n * 2;
    const m = new THREE.Object3D();
    this.seatPos = [];
    info.seats.forEach((s, i) => {
      const g = rowGeo[s.rowIdx];
      const sc = g.rec ? 1.18 : 1;
      const x = xOf(s.col), zc = g.z0 + g.depth * (g.rec ? 0.42 : 0.4), yb = g.y;
      this.seatPos.push({ x: x, y: yb, z: zc, rec: g.rec });
      m.rotation.set(0, 0, 0); m.scale.set(sc, sc, g.rec ? 1.35 : 1);
      m.position.set(x, yb + 0.42 * sc, zc);
      m.updateMatrix(); this.cush.setMatrixAt(i, m.matrix);
      m.rotation.set(g.rec ? 0.32 : 0.14, 0, 0); m.scale.set(sc, sc * (g.rec ? 1.05 : 1), sc);
      m.position.set(x, yb + 0.8 * sc, zc + (g.rec ? 0.42 : 0.27));
      m.updateMatrix(); this.back.setMatrixAt(i, m.matrix);
      [-1, 1].forEach((sd, k) => {
        m.rotation.set(0, 0, 0); m.scale.set(1, 1, g.rec ? 1.4 : 1);
        m.position.set(x + sd * 0.29 * sc, yb + 0.3, zc + 0.04);
        m.updateMatrix(); this.arms.setMatrixAt(i * 2 + k, m.matrix);
      });
    });
    [this.cush, this.back, this.arms].forEach(o => { o.instanceMatrix.needsUpdate = true; this.root.add(o); });
    this.applyColors();

    // Row labels at both ends
    const firstCol = {}, lastCol = {};
    info.seats.forEach(s => {
      firstCol[s.rowIdx] = Math.min(firstCol[s.rowIdx] == null ? 1e9 : firstCol[s.rowIdx], s.col);
      lastCol[s.rowIdx] = Math.max(lastCol[s.rowIdx] == null ? -1 : lastCol[s.rowIdx], s.col);
    });
    rowGeo.forEach((g, i) => {
      if (firstCol[i] == null) return;
      const tex = labelTexture(g.label);
      [xOf(firstCol[i]) - 0.62, xOf(lastCol[i]) + 0.62].forEach(lx => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        sp.scale.set(0.42, 0.42, 1);
        sp.position.set(lx, g.y + 0.62, g.z0 + g.depth * 0.4);
        this.root.add(sp);
      });
    });

    // Sightline frustum (seat eye to screen corners)
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(24).fill(0), 3));
    this.sightLines = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: 0xf2b33d, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.9 }));
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(36).fill(0), 3));
    this.sightFaces = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: 0xf2b33d, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
    this.sight = new THREE.Group();
    this.sight.add(this.sightLines, this.sightFaces);
    this.sight.visible = false;
    this.root.add(this.sight);

    this.updateSight();
    if (!this.placed) { this.preset('overview', true); this.placed = true; }
  }

  seatIndex(id) { return this.info ? this.info.seats.findIndex(s => s.id === id) : -1; }
  eyeOf(i) { const p = this.seatPos[i]; const sc = p.rec ? 1.18 : 1; return new THREE.Vector3(p.x, p.y + 1.18 * (p.rec ? 0.92 : 1), p.z + (p.rec ? 0.3 : 0.12) * sc); }

  setStates(states) { this.states = states || {}; this.applyColors(); }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.applyColors(); this.updateSight(); }
  setFocus(id) { this.focusId = id; this.updateSight(); }

  applyColors() {
    if (!this.cush || !this.info) return;
    const col = new THREE.Color();
    this.info.seats.forEach((s, i) => {
      const st = this.states[s.id] || 'available';
      const hov = this.hoverId === s.id;
      col.setHex(SEAT_RGB[st + (hov ? 'Hover' : '')] || SEAT_RGB.available);
      this.cush.setColorAt(i, col);
      this.back.setColorAt(i, col);
    });
    if (this.cush.instanceColor) this.cush.instanceColor.needsUpdate = true;
    if (this.back.instanceColor) this.back.instanceColor.needsUpdate = true;
  }

  updateSight() {
    if (!this.sight) return;
    const id = this.hoverId || this.focusId;
    const i = id ? this.seatIndex(id) : -1;
    if (i < 0 || this.mode !== 'orbit') { this.sight.visible = false; return; }
    const e = this.eyeOf(i), c = this.screenCorners;
    const lp = this.sightLines.geometry.attributes.position;
    const fp = this.sightFaces.geometry.attributes.position;
    for (let k = 0; k < 4; k++) {
      lp.setXYZ(k * 2, e.x, e.y, e.z); lp.setXYZ(k * 2 + 1, c[k].x, c[k].y, c[k].z);
      const a = c[k], b = c[(k + 1) % 4];
      fp.setXYZ(k * 3, e.x, e.y, e.z); fp.setXYZ(k * 3 + 1, a.x, a.y, a.z); fp.setXYZ(k * 3 + 2, b.x, b.y, b.z);
    }
    lp.needsUpdate = true; fp.needsUpdate = true;
    this.sightLines.computeLineDistances();
    this.sight.visible = true;
  }

  /* Screen media: {kind:'video'|'image', url} or {kind:'canvas', draw(ctx,w,h,t)} */
  setMedia(media) {
    if (this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); this.video = null; }
    if (this.screenTex) this.screenTex.dispose();
    this.screenTex = null; this.mediaTick = null;
    if (!media) return;
    let tex;
    if (media.kind === 'video') {
      const v = document.createElement('video');
      v.src = media.url; v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous';
      v.setAttribute('playsinline', ''); v.play().catch(() => {});
      this.video = v;
      tex = new THREE.VideoTexture(v);
    } else if (media.kind === 'image') {
      tex = new THREE.TextureLoader().load(media.url);
    } else {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 466;
      const ctx = cv.getContext('2d');
      tex = new THREE.CanvasTexture(cv);
      let last = 0;
      this.mediaTick = t => { if (t - last < 0.04) return; last = t; media.draw(ctx, cv.width, cv.height, t); tex.needsUpdate = true; };
      media.draw(ctx, cv.width, cv.height, 0);
    }
    tex.minFilter = THREE.LinearFilter;
    this.screenTex = tex;
    if (this.screenMat) { this.screenMat.map = tex; this.screenMat.needsUpdate = true; }
  }
  get hasVideo() { return !!this.video; }
  setSound(on) { if (this.video) { this.video.muted = !on; if (on) this.video.play().catch(() => {}); } }

  /* ---------- camera ---------- */
  centerTarget() { return new THREE.Vector3(0, this.H * 0.22, this.D * 0.52); }
  preset(name, instant) {
    const t = this.centerTarget(), W = this.W, D = this.D, H = this.H, big = Math.max(W, D);
    let p, tg = t;
    if (name === 'overview') p = new THREE.Vector3(-W * 0.95, big * 1.05, D * 1.2);
    else if (name === 'back') { p = new THREE.Vector3(0, H * 1.1, D * 1.45); tg = new THREE.Vector3(0, this.screenY * 0.7, D * 0.35); }
    else if (name === 'front') { p = new THREE.Vector3(W * 0.35, H * 0.85, -D * 0.05 + 2.2); tg = new THREE.Vector3(0, this.H * 0.2, D * 0.6); }
    else if (name === 'top') p = new THREE.Vector3(0.01, big * 1.7, D * 0.52);
    this.go(p, tg, 'orbit', instant ? 0 : 900);
  }
  viewFromSeat(id) {
    const i = this.seatIndex(id);
    if (i < 0) return;
    const e = this.eyeOf(i);
    this.go(e, new THREE.Vector3(0, this.screenY, this.screenZ), 'fp', 1100);
    this.seatView = id;
  }
  fly() {
    this.seatView = null;
    const last = this.rowGeo[this.rowGeo.length - 1];
    const p = new THREE.Vector3(0, (last ? last.y : 0) + 1.7, this.D - 0.8);
    this.go(p, new THREE.Vector3(0, this.screenY, this.screenZ), 'fp', 1000);
  }
  currentTarget() {
    if (this.mode === 'orbit') return this.controls.target.clone();
    const f = new THREE.Vector3(); this.camera.getWorldDirection(f);
    return this.camera.position.clone().add(f.multiplyScalar(6));
  }
  go(pos, target, mode, dur) {
    const fromP = this.camera.position.clone(), fromT = this.currentTarget();
    if (mode === 'orbit') this.seatView = null;
    this.mode = mode;
    this.controls.enabled = false;
    if (!dur) { this.anim = null; this.finishGo(pos, target, mode); return; }
    this.anim = { t0: performance.now(), dur: dur, fromP: fromP, fromT: fromT, toP: pos.clone(), toT: target.clone(), mode: mode };
    this.updateSight();
    if (this.opts.onModeChange) this.opts.onModeChange(mode, this.seatView);
  }
  finishGo(pos, target, mode) {
    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    if (mode === 'orbit') {
      this.controls.target.copy(target);
      this.controls.enabled = true;
      this.controls.update();
    } else {
      const d = target.clone().sub(pos).normalize();
      this.yaw = Math.atan2(-d.x, -d.z);
      this.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
    this.updateSight();
    if (this.opts.onModeChange) this.opts.onModeChange(mode, this.seatView);
  }
  zoom(dir) {
    if (this.anim) return;
    if (this.mode === 'orbit') {
      const off = this.camera.position.clone().sub(this.controls.target);
      const len = off.length() * (dir > 0 ? 0.78 : 1.28);
      off.setLength(Math.max(this.controls.minDistance || 1, Math.min(len, Math.max(this.W, this.D) * 3)));
      this.go(this.controls.target.clone().add(off), this.controls.target.clone(), 'orbit', 350);
    } else {
      this.moveFP(0, 0, dir * 1.4);
    }
  }
  moveFP(dx, dy, dz) {
    const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const r = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const p = this.camera.position;
    p.addScaledVector(f, dz).addScaledVector(r, dx);
    p.y += dy;
    p.x = Math.max(-this.W / 2 + 0.3, Math.min(this.W / 2 - 0.3, p.x));
    p.y = Math.max(0.6, Math.min(this.H - 0.3, p.y));
    p.z = Math.max(0.9, Math.min(this.D - 0.3, p.z));
    if (this.seatView && (dx || dy || dz)) { this.seatView = null; if (this.opts.onModeChange) this.opts.onModeChange('fp', null); }
  }

  bindInput() {
    const c = this.renderer.domElement;
    let down = null, last = null;
    this._pd = e => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() }; last = { x: e.clientX, y: e.clientY };
      if (this.mode === 'fp') c.setPointerCapture(e.pointerId);
    };
    this._pm = e => {
      if (down && this.mode === 'fp' && !this.anim) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        this.yaw += dx * 0.0042; this.pitch += dy * 0.0042;
        this.pitch = Math.max(-1.25, Math.min(1.25, this.pitch));
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        if (this.seatView && Math.abs(dx) + Math.abs(dy) > 0) { /* looking around keeps seat view */ }
      }
      if (down) last = { x: e.clientX, y: e.clientY };
      if (e.pointerType === 'touch' && down) return;
      const hit = this.pick(e);
      this.setHover(hit ? hit.id : null);
      c.style.cursor = hit ? (this.states[hit.id] === 'booked' ? 'not-allowed' : 'pointer') : (this.mode === 'fp' ? 'grab' : 'default');
      if (this.opts.onHover) this.opts.onHover(hit, e);
    };
    this._pu = e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 6) return;
      const hit = this.pick(e);
      if (hit && this.opts.onSeatClick) this.opts.onSeatClick(hit, e);
    };
    this._pl = () => { if (!down) { this.setHover(null); if (this.opts.onHover) this.opts.onHover(null); } };
    this._dbl = e => { const hit = this.pick(e); if (hit && this.opts.onSeatDouble) this.opts.onSeatDouble(hit); };
    this._wheel = e => { if (this.mode === 'fp') { e.preventDefault(); this.moveFP(0, 0, -Math.sign(e.deltaY) * 0.6); } };
    this._kd = e => {
      if (/input|textarea|select/i.test((e.target && e.target.tagName) || '')) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (this.mode !== 'fp' && this.opts.interactive !== false && !this.opts.compact) this.fp_fromOrbit();
        this.keys[k] = true;
        if (k.startsWith('arrow')) e.preventDefault();
      }
    };
    this._ku = e => { this.keys[e.key.toLowerCase()] = false; };
    c.addEventListener('pointerdown', this._pd);
    c.addEventListener('pointermove', this._pm);
    c.addEventListener('pointerup', this._pu);
    c.addEventListener('pointerleave', this._pl);
    c.addEventListener('dblclick', this._dbl);
    c.addEventListener('wheel', this._wheel, { passive: false });
    if (!this.opts.compact) { window.addEventListener('keydown', this._kd); window.addEventListener('keyup', this._ku); }
  }
  fp_fromOrbit() {
    const pos = this.camera.position.clone();
    const inside = Math.abs(pos.x) < this.W / 2 && pos.z > 0 && pos.z < this.D && pos.y < this.H;
    if (inside) { this.mode = 'fp'; this.controls.enabled = false; this.finishGo(pos, this.controls.target.clone(), 'fp'); }
    else this.fly();
  }
  pick(e) {
    if (!this.cush || !this.info || !this.info.seats.length) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ptr, this.camera);
    const hits = this.raycaster.intersectObjects([this.cush, this.back], false);
    if (!hits.length || hits[0].instanceId == null) return null;
    return this.info.seats[hits[0].instanceId];
  }
  projectSeat(id) {
    const i = this.seatIndex(id); if (i < 0) return null;
    const p = this.seatPos[i];
    const v = new THREE.Vector3(p.x, p.y + (p.rec ? 1.55 : 1.35), p.z + 0.1).project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x + 1) / 2 * this.el.clientWidth, y: (1 - v.y) / 2 * this.el.clientHeight };
  }
  setTags(ids) { this.tagIds = ids || []; this.tagEls = {}; this.tagLayer.innerHTML = ''; this.tagIds.forEach(id => { const d = document.createElement('div'); d.className = 'seat-tag'; d.textContent = id; this.tagLayer.appendChild(d); this.tagEls[id] = d; }); }

  frame() {
    if (this.disposed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    if (this.anim) {
      const a = this.anim;
      let k = Math.min(1, (performance.now() - a.t0) / a.dur);
      const ek = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const p = a.fromP.clone().lerp(a.toP, ek), tg = a.fromT.clone().lerp(a.toT, ek);
      this.camera.position.copy(p); this.camera.lookAt(tg);
      if (k >= 1) { this.anim = null; this.finishGo(a.toP, a.toT, a.mode); }
    } else if (this.mode === 'orbit') {
      this.controls.update();
    } else {
      const K = this.keys, sp = 4.2 * dt;
      const fz = (K.w || K.arrowup ? 1 : 0) - (K.s || K.arrowdown ? 1 : 0);
      const fx = (K.d ? 1 : 0) - (K.a ? 1 : 0);
      const turn = (K.arrowleft ? 1 : 0) - (K.arrowright ? 1 : 0);
      const fy = (K.e ? 1 : 0) - (K.q ? 1 : 0);
      if (turn) { this.yaw += turn * 1.6 * dt; this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ'); }
      if (fz || fx || fy) this.moveFP(fx * sp, fy * sp, fz * sp);
      if (this.hold) this.moveFP(this.hold.x * sp, this.hold.y * sp, this.hold.z * sp);
    }
    if (this.mediaTick) this.mediaTick(t);
    if (this.screenLight) this.screenLight.intensity = 1.25 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 5.3) * 0.04;
    if (this.tagIds && this.tagIds.length) {
      this.tagIds.forEach(id => {
        const el = this.tagEls[id]; const p = this.projectSeat(id);
        if (!p || this.mode === 'fp') { el.hidden = true; return; }
        el.hidden = false; el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-100%)';
      });
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    this.setMedia(null);
    this.clearRoot();
    this.controls.dispose();
    this.renderer.dispose();
    try { this.renderer.forceContextLoss(); } catch (e) {}
    this.el.innerHTML = '';
  }
}

const _labelCache = {};
function labelTexture(text) {
  if (_labelCache[text]) return _labelCache[text];
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(10,11,16,0.85)';
  x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(242,179,61,0.7)'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#f3ead8'; x.font = '700 64px "Big Shoulders Display", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(cv);
  _labelCache[text] = t;
  return t;
}
