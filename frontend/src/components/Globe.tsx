import { useEffect, useMemo, useRef, useState } from "react";

export interface Keyword {
  word: string;
  weight: number;
}

interface GlobeVisualizationProps {
  keywords: Keyword[];
  isActive: boolean;
}

type PlacedWord = {
  word: string;
  w: number;
  wn: number;
  theta: number;
  phi: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function weightToColor(t01: number) {
  const t = clamp(t01, 0, 1);
  const r = Math.round(lerp(120, 170, t));
  const g = Math.round(lerp(170, 140, t));
  const b = 255;
  return { r, g, b };
}

function randomSpherePoint() {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return { theta, phi };
}

function toVec(theta: number, phi: number) {
  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
}
function toAngles(v: { x: number; y: number; z: number }) {
  const y = clamp(v.y, -1, 1);
  const phi = Math.acos(y);
  const theta = Math.atan2(v.z, v.x);
  return { theta, phi };
}
function normalize(v: { x: number; y: number; z: number }) {
  const m = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}
function angularDistance(a: { theta: number; phi: number }, b: { theta: number; phi: number }) {
  const A = toVec(a.theta, a.phi);
  const B = toVec(b.theta, b.phi);
  const dot = clamp(A.x * B.x + A.y * B.y + A.z * B.z, -1, 1);
  return Math.acos(dot);
}

export function GlobeVisualization({ keywords, isActive }: GlobeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const velRef = useRef(0);
  const rotationRef = useRef(0);

  const [hover, setHover] = useState<{ word: string; weight: number; x: number; y: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number; inside: boolean }>({ x: 0, y: 0, inside: false });

  // ======= TUNE =======
  const DPR = .9;
  const Y_SQUASH = 0.76;

  const MAX_FONT = 40;
  const MIN_FONT = 12;

  const MIN_GAP = 0.35;
  const WEIGHT_GAP = 0.6;
  const EXTRA_GAP_BIG = 0.55;

  const TRIES_PER_WORD = 900;
  const RELAX_ITERS = 140;
  const RELAX_STEP = 0.018;

  const RIM_START = 0.78;
  const AUTO_ROT = 0.003;
  // ====================

  const placedWords: PlacedWord[] = useMemo(() => {
    const cleaned = [...keywords]
      .filter((k) => k.word?.trim())
      .map((k) => ({ word: k.word.trim(), w: clamp(k.weight ?? 0, 0, 1) }))
      .sort((a, b) => b.w - a.w);

    const ws = cleaned.map((x) => x.w);
    const wMax = ws.length ? Math.max(...ws) : 1;
    const wMin = ws.length ? Math.min(...ws) : 0;
    const denom = Math.max(1e-6, wMax - wMin);

    const placed: PlacedWord[] = [];

    for (const item of cleaned) {
      const wn = clamp((item.w - wMin) / denom, 0, 1);

      let chosen: { theta: number; phi: number } | null = null;

      for (let t = 0; t < TRIES_PER_WORD; t++) {
        const cand = randomSpherePoint();

        let ok = true;
        for (const p of placed) {
          const big = Math.max(wn, p.wn);
          const pairNeeded = MIN_GAP + big * WEIGHT_GAP + big * big * EXTRA_GAP_BIG;
          if (angularDistance(cand, p) < pairNeeded) {
            ok = false;
            break;
          }
        }

        if (ok) {
          chosen = cand;
          break;
        }
      }

      if (!chosen) {
        let best = randomSpherePoint();
        let bestScore = -Infinity;

        for (let t = 0; t < TRIES_PER_WORD; t++) {
          const cand = randomSpherePoint();
          let minD = Infinity;

          for (const p of placed) {
            const d = angularDistance(cand, p);
            if (d < minD) minD = d;
          }

          if (minD > bestScore) {
            bestScore = minD;
            best = cand;
          }
        }

        chosen = best;
      }

      placed.push({ word: item.word, w: item.w, wn, theta: chosen.theta, phi: chosen.phi });
    }

    const vecs = placed.map((p) => ({ ...toVec(p.theta, p.phi) }));
    for (let it = 0; it < RELAX_ITERS; it++) {
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const bi = placed[i].wn;
          const bj = placed[j].wn;
          const big = Math.max(bi, bj);
          const needed = MIN_GAP + big * WEIGHT_GAP + big * big * EXTRA_GAP_BIG;

          const ai = toAngles(vecs[i]);
          const aj = toAngles(vecs[j]);
          const d = angularDistance(ai, aj);

          if (d < needed) {
            const push = (needed - d) * RELAX_STEP;

            const dx = vecs[i].x - vecs[j].x;
            const dy = vecs[i].y - vecs[j].y;
            const dz = vecs[i].z - vecs[j].z;
            const m = Math.hypot(dx, dy, dz) || 1;

            const ux = dx / m;
            const uy = dy / m;
            const uz = dz / m;

            vecs[i] = normalize({ x: vecs[i].x + ux * push, y: vecs[i].y + uy * push, z: vecs[i].z + uz * push });
            vecs[j] = normalize({ x: vecs[j].x - ux * push, y: vecs[j].y - uy * push, z: vecs[j].z - uz * push });
          }
        }
      }
    }

    for (let i = 0; i < placed.length; i++) {
      const ang = toAngles(vecs[i]);
      placed[i].theta = ang.theta;
      placed[i].phi = ang.phi;
    }

    return placed;
  }, [keywords]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cachedW = 0;
    let cachedH = 0;
    let cachedRadius = 0;
    let vignette: CanvasGradient | null = null;
    let sphereGrad: CanvasGradient | null = null;

    const resize = () => {
      const parent = canvas.parentElement;
      const cssW = parent ? parent.clientWidth : 600;
      const cssH = parent ? parent.clientHeight : 600;

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      canvas.width = Math.floor(cssW * DPR);
      canvas.height = Math.floor(cssH * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      cachedW = 0;
      cachedH = 0;
    };

    const ensureCaches = (W: number, H: number) => {
      if (W === cachedW && H === cachedH && vignette && sphereGrad) return;

      cachedW = W;
      cachedH = H;

      const cx = W / 2;
      const cy = H / 2;
      cachedRadius = Math.min(W, H) * 0.33;

      vignette = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.1, cx, cy, Math.max(W, H) * 0.75);
      vignette.addColorStop(0, "rgba(10, 14, 22, 0.0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.25)");

      sphereGrad = ctx.createRadialGradient(
        cx - cachedRadius * 0.25,
        cy - cachedRadius * 0.25,
        cachedRadius * 0.1,
        cx,
        cy,
        cachedRadius
      );
      sphereGrad.addColorStop(0, "rgba(59,130,246,0.40)");
      sphereGrad.addColorStop(0.7, "rgba(37,99,235,0.22)");
      sphereGrad.addColorStop(1, "rgba(29,78,216,0.10)");
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;

    const draw = () => {
      const W = canvas.width / DPR;
      const H = canvas.height / DPR;
      const cx = W / 2;
      const cy = H / 2;

      ensureCaches(W, H);
      const radius = cachedRadius;

      ctx.clearRect(0, 0, W, H);

      if (vignette) {
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad ?? "rgba(59,130,246,0.2)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59,130,246,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = -2; i <= 2; i++) {
        const y = cy + (i * radius) / 3;
        const w = Math.sqrt(Math.max(0, radius * radius - ((i * radius) / 3) ** 2)) * 2;
        ctx.beginPath();
        ctx.ellipse(cx, y, w / 2, w * 0.15, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(59,130,246,0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const rot = rotationRef.current;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 6 + rot;
        const compression = Math.abs(Math.cos(a)) * 0.8 + 0.2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * compression, radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${0.10 + compression * 0.10})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      if (!isActive || placedWords.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = `500 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Paste a URL and click Analyze to generate the word cloud.", cx, cy + radius + 30);
      } else {
        const a = radius * 1.05;
        const b = radius * Y_SQUASH;
        const invA = 1 / a;
        const invB = 1 / b;

        const projected = placedWords.map((pw) => {
          const theta = pw.theta + rot;
          const phi = pw.phi;

          const x3 = Math.sin(phi) * Math.cos(theta);
          const y3 = Math.cos(phi);
          const z3 = Math.sin(phi) * Math.sin(theta);

          const depth = (z3 + 1) / 2;

          const scale = lerp(0.62, 1.18, depth);
          const x2 = cx + x3 * a;
          const y2 = cy + y3 * b;

          return { ...pw, x2, y2, z3, depth, scale };
        });

        let hoverCandidate: { word: string; weight: number; x: number; y: number; d: number } | null = null;
        if (mouseRef.current.inside) {
          const mx = mouseRef.current.x;
          const my = mouseRef.current.y;

          for (const p of projected) {
            const base = lerp(MIN_FONT, MAX_FONT, p.wn);
            const fontSize = base * p.scale;

            const dist = Math.hypot(mx - p.x2, my - p.y2);
            const hit = fontSize * 0.95;

            if (dist < hit) {
              const score = dist - p.depth * 10;
              if (!hoverCandidate || score < hoverCandidate.d) {
                hoverCandidate = { word: p.word, weight: p.w, x: mx, y: my, d: score };
              }
            }
          }
        }

        projected.sort((aa, bb) => aa.z3 - bb.z3);

        for (const p of projected) {
          let fontSize = lerp(MIN_FONT, MAX_FONT, p.wn) * p.scale;
          fontSize = Math.min(MAX_FONT, Math.max(MIN_FONT, fontSize));

          const depthFade = Math.pow(clamp(p.depth, 0, 1), 1.85);
          const alphaDepth = lerp(0.10, 1.0, depthFade);

          const dx = (p.x2 - cx) * invA;
          const dy = (p.y2 - cy) * invB;
          const rim = clamp(Math.sqrt(dx * dx + dy * dy), 0, 1);
          const t = clamp((rim - RIM_START) / (1 - RIM_START), 0, 1);
          const rimFade = lerp(1, 0.35, t);

          let alpha = alphaDepth * rimFade;

          const { r, g, b: blue } = weightToColor(p.wn);

          const isHovered = hoverCandidate?.word === p.word;
          if (isHovered) alpha = 1;

          ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${r},${g},${blue},${alpha})`;

          const sx = Math.round(p.x2 * 2) / 2;
          const sy = Math.round(p.y2 * 2) / 2;

          if (p.depth > 0.65) {
            ctx.save();
            ctx.shadowColor = `rgba(59,130,246,${0.22 * p.depth})`;
            ctx.shadowBlur = 10;
            ctx.fillText(p.word, sx, sy);
            ctx.restore();
          } else {
            ctx.fillText(p.word, sx, sy);
          }
        }

        if (hoverCandidate) {
          setHover({ word: hoverCandidate.word, weight: hoverCandidate.weight, x: hoverCandidate.x, y: hoverCandidate.y });
        } else if (hover) {
          setHover(null);
        }
      }

      rotationRef.current += AUTO_ROT + velRef.current;
      velRef.current *= 0.92;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onMouseDown = (e: MouseEvent) => {
      draggingRef.current = true;
      lastXRef.current = e.clientX;
    };
    const onMouseUp = () => {
      draggingRef.current = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, inside };

      if (!draggingRef.current) return;

      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;

      const delta = dx * 0.003;
      rotationRef.current += delta;
      velRef.current = clamp(delta, -0.08, 0.08);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, [placedWords, isActive]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: "drop-shadow(0 0 20px rgba(59,130,246,0.30))",
          cursor: "grab",
          userSelect: "none",
        }}
      />
      {hover && (
        <div
          style={{
            position: "absolute",
            left: hover.x + 12,
            top: hover.y + 12,
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(10, 14, 22, 0.85)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 12,
            pointerEvents: "none",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{hover.word}</div>
          <div style={{ opacity: 0.85 }}>weight: {hover.weight.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
