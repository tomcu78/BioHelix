/* <synsci-loader> — BioHelix 3D Animated DNA Double-Helix Loader
   Attributes: size · progress (0–1) · caption="Opening session" · bar · label · state="done" */

class SynSciLoader extends HTMLElement {
  static get observedAttributes() { return ["size", "density", "bar", "label", "caption", "progress", "state"]; }

  connectedCallback() {
    if (!this.shadowRoot) {
      const r = this.attachShadow({ mode: "open" });
      r.innerHTML = `<style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2em;
          line-height: 1;
          vertical-align: middle;
          font: 500 13px/1 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        canvas {
          display: block;
          filter: drop-shadow(0 6px 20px rgba(99, 102, 241, 0.25));
        }
        .bar { display: none; width: var(--w); max-width: 100%; }
        :host([bar]) .bar { display: block; }
        .track {
          height: 3px;
          border-radius: 3px;
          background: rgba(99, 102, 241, 0.12);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #06b6d4, #6366f1, #a855f7);
          border-radius: 3px;
          transform-origin: 0 50%;
          transform: scaleX(0);
        }
        .fill.ind { animation: ind 1.6s cubic-bezier(.6,0,.3,1) infinite; }
        @keyframes ind {
          0% { transform: translateX(-100%) scaleX(.35); }
          100% { transform: translateX(100%) scaleX(.35); }
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-top: .7em;
          opacity: .75;
          font-variant-numeric: tabular-nums;
          letter-spacing: .01em;
          color: #6366f1;
        }
        .cap {
          display: none;
          letter-spacing: .02em;
          white-space: nowrap;
          position: relative;
          color: #4f46e5;
          font-weight: 600;
          font-size: 13px;
        }
        :host([caption]) .cap { display: block; }
        .cap i {
          font-style: normal;
          animation: dot 1.4s infinite both;
          color: #8b5cf6;
        }
        .cap i:nth-child(2) { animation-delay: .2s; }
        .cap i:nth-child(3) { animation-delay: .4s; }
        @keyframes dot {
          0%, 20% { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cap i { animation: none; }
          .fill.ind { animation-duration: 4s; }
        }
      </style>
      <canvas role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100"></canvas>
      <div class="cap" aria-hidden="true"><span class="capt"></span><b><i>.</i><i>.</i><i>.</i></b></div>
      <div class="bar">
        <div class="track"><div class="fill"></div></div>
        <div class="row"><span class="lab"></span><span class="pct"></span></div>
      </div>`;
      this.c = r.querySelector("canvas");
      this.g = this.c.getContext("2d");
      this.$fill = r.querySelector(".fill");
      this.$pct = r.querySelector(".pct");
      this.$lab = r.querySelector(".lab");
      this.$cap = r.querySelector(".capt");
      this.$dots = r.querySelectorAll(".cap i");
    }
    this.t = 0;
    this.last = 0;
    this.shown = 0;
    this.burst = -1;
    this.still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.build();
    const tick = (now) => {
      if (!this.isConnected) return;
      this.step(Math.min(0.05, (now - (this.last || now)) / 1000));
      this.last = now;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.raf);
  }

  attributeChangedCallback(n) {
    if (!this.c) return;
    if (n === "size") this.build();
    if (n === "state" && this.getAttribute("state") === "done") this.burst = 0;
  }

  get progress() {
    return this.hasAttribute("progress") ? Math.max(0, Math.min(1, parseFloat(this.getAttribute("progress")) || 0)) : null;
  }

  set progress(v) {
    v == null ? this.removeAttribute("progress") : this.setAttribute("progress", v);
  }

  complete() {
    this.setAttribute("state", "done");
  }

  reset() {
    this.removeAttribute("state");
    this.burst = -1;
    this.shown = 0;
  }

  build() {
    const s = this.s = parseFloat(this.getAttribute("size")) || 160;
    const dpr = this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.c.width = this.c.height = Math.round(s * dpr);
    this.c.style.width = this.c.style.height = `${s}px`;
    this.style.setProperty("--w", `${Math.max(120, s)}px`);
  }

  step(dt) {
    const sp = (parseFloat(this.getAttribute("speed")) || 1) * (this.still ? 0.3 : 1);
    this.t += dt * sp;
    const done = this.getAttribute("state") === "done";
    const p = this.progress;
    const target = done ? 1 : (p == null ? 0 : p);
    this.shown += (target - this.shown) * Math.min(1, dt * 6);
    if (this.burst >= 0) this.burst += dt;

    this.draw();

    if (this.hasAttribute("bar")) {
      const ind = p == null && !done;
      if (ind) {
        this.$fill.classList.add("ind");
        this.$fill.style.transform = "";
        this.$pct.textContent = "";
      } else {
        this.$fill.classList.remove("ind");
        this.$fill.style.transform = `scaleX(${this.shown.toFixed(4)})`;
        this.$pct.textContent = `${Math.round(this.shown * 100)}%`;
      }
      this.$lab.textContent = done
        ? (this.getAttribute("done-label") || "Ready")
        : (this.getAttribute("label") || "Loading");
    }

    if (this.hasAttribute("caption")) {
      const txt = done
        ? (this.getAttribute("done-label") || this.getAttribute("caption") || "Loading")
        : (this.getAttribute("caption") || "Loading");
      if (this.$cap.textContent !== txt) this.$cap.textContent = txt;
      this.$dots.forEach((d) => d.style.display = done ? "none" : "");
    }

    if (p != null) this.c.setAttribute("aria-valuenow", Math.round(this.shown * 100));
    else this.c.removeAttribute("aria-valuenow");
  }

  draw() {
    const g = this.g;
    const px = this.c.width;
    const dpr = this.dpr;
    const t = this.t;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, px, px);

    const cx = px / 2;
    const cy = px / 2;
    const H = px * 0.72;
    const R = px * 0.22;
    const rotSpeed = 2.4;
    const theta = t * rotSpeed;
    const isDone = this.getAttribute("state") === "done";
    const p = this.progress;
    const maxProgress = isDone ? 1 : (p != null ? this.shown : 1);

    const SAMPLES = 64;
    const strand1Pts = [];
    const strand2Pts = [];
    const maxSample = Math.round(SAMPLES * maxProgress);

    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      const yRel = (u - 0.5) * H;
      const y = cy + yRel;
      const psi = u * Math.PI * 2;
      const ang = psi + theta;

      const x1 = cx + R * Math.sin(ang);
      const z1 = R * Math.cos(ang);

      const x2 = cx - R * Math.sin(ang);
      const z2 = -z1;

      strand1Pts.push({ x: x1, y, z: z1, u });
      strand2Pts.push({ x: x2, y, z: z2, u });
    }

    // 1. Base-pair rungs
    const RUNGS = 9;
    for (let j = 0; j < RUNGS; j++) {
      const ru = (j + 0.5) / RUNGS;
      if (ru > maxProgress) continue;
      const idx = Math.min(SAMPLES, Math.round(ru * SAMPLES));
      const p1 = strand1Pts[idx];
      const p2 = strand2Pts[idx];
      if (!p1 || !p2) continue;

      const rungAlpha = 0.5 + 0.45 * (Math.abs(p1.x - p2.x) / (2 * R));

      g.beginPath();
      g.moveTo(p1.x, p1.y);
      g.lineTo(p2.x, p2.y);
      g.strokeStyle = `rgba(129, 140, 248, ${rungAlpha.toFixed(2)})`;
      g.lineWidth = Math.max(1.5, 2.5 * dpr);
      g.stroke();

      g.fillStyle = "#818cf8";
      g.beginPath();
      g.arc((p1.x + p2.x) / 2, p1.y, Math.max(1, 1.8 * dpr), 0, Math.PI * 2);
      g.fill();
    }

    // 2. Draw strands with 3D depth (back first, front second)
    const drawStrandSegments = (pts, strokeColor, isBack) => {
      for (let i = 0; i < maxSample; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];
        if (!pA || !pB) continue;

        const isPtBack = pA.z < 0;
        if (isBack !== isPtBack) continue;

        const depthFactor = (pA.z / R + 1) / 2;
        const alpha = isBack ? 0.42 : (0.75 + 0.25 * depthFactor);
        const lw = isBack ? Math.max(1.8, 2.6 * dpr) : Math.max(2.5, 4.2 * dpr);

        g.beginPath();
        g.moveTo(pA.x, pA.y);
        g.lineTo(pB.x, pB.y);
        g.strokeStyle = strokeColor(alpha);
        g.lineWidth = lw;
        g.lineCap = "round";
        g.stroke();
      }
    };

    const cyanColor = (a) => `rgba(6, 182, 212, ${a.toFixed(2)})`;
    const violetColor = (a) => `rgba(168, 85, 247, ${a.toFixed(2)})`;

    drawStrandSegments(strand1Pts, cyanColor, true);
    drawStrandSegments(strand2Pts, violetColor, true);
    drawStrandSegments(strand1Pts, cyanColor, false);
    drawStrandSegments(strand2Pts, violetColor, false);

    // 3. Glowing nodes along the strands
    const nodeCount = 5;
    for (let n = 0; n <= nodeCount; n++) {
      const nu = n / nodeCount;
      if (nu > maxProgress) continue;
      const idx = Math.min(SAMPLES, Math.round(nu * SAMPLES));
      const p1 = strand1Pts[idx];
      const p2 = strand2Pts[idx];

      if (p1) {
        const zNorm1 = (p1.z / R + 1) / 2;
        const r1 = Math.max(2.5, (3.2 + 2 * zNorm1) * dpr);
        g.save();
        g.shadowColor = "#06b6d4";
        g.shadowBlur = 8 * dpr;
        g.fillStyle = zNorm1 > 0.5 ? "#38bdf8" : "#0284c7";
        g.beginPath();
        g.arc(p1.x, p1.y, r1, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }

      if (p2) {
        const zNorm2 = (p2.z / R + 1) / 2;
        const r2 = Math.max(2.5, (3.2 + 2 * zNorm2) * dpr);
        g.save();
        g.shadowColor = "#a855f7";
        g.shadowBlur = 8 * dpr;
        g.fillStyle = zNorm2 > 0.5 ? "#c084fc" : "#7c3aed";
        g.beginPath();
        g.arc(p2.x, p2.y, r2, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }

    // 4. Central crossover nodes (top, center, bottom)
    const crossovers = [0, 0.5, 1];
    crossovers.forEach((cu, idx) => {
      if (cu > maxProgress) return;
      const cIdx = Math.min(SAMPLES, Math.round(cu * SAMPLES));
      const pt = strand1Pts[cIdx];
      if (!pt) return;
      const col = idx === 0 ? "#06b6d4" : idx === 1 ? "#6366f1" : "#a855f7";
      const rad = Math.max(3.2, 5 * dpr);
      g.save();
      g.shadowColor = col;
      g.shadowBlur = 14 * dpr;
      g.fillStyle = col;
      g.beginPath();
      g.arc(cx, pt.y, rad, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });

    // 5. Completion shockwave/glow if done
    if (this.burst >= 0 && this.burst < 1.2) {
      const q = this.burst / 1.2;
      const ringRad = R * (1 + 2 * (1 - Math.pow(1 - q, 3)));
      g.save();
      g.strokeStyle = `rgba(99, 102, 241, ${(0.6 * (1 - q)).toFixed(2)})`;
      g.lineWidth = Math.max(1, 3 * (1 - q) * dpr);
      g.beginPath();
      g.arc(cx, cy, ringRad, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  }
}

if (!customElements.get("synsci-loader")) customElements.define("synsci-loader", SynSciLoader);
export { SynSciLoader };

