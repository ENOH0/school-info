import { Component, computed, input } from '@angular/core';
import { ChartBlock } from '../../core/book.model';

// กราฟในเล่ม วาดเองด้วย SVG (ไม่ต้องลงไลบรารีเพิ่ม)
//   bar  = แท่ง (หลายคอลัมน์ = แท่งเรียงกันในแต่ละกลุ่ม)
//   line = เส้น
//   pie  = วงกลม (คอลัมน์แรกคอลัมน์เดียว)

const COLORS = ['#1d4ed8', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b', '#ec4899'];
const H = 300;
const M = { top: 20, right: 16, bottom: 52, left: 64 };

interface Bar { x: number; y: number; w: number; h: number; color: string; tip: string; label: string; lx: number; ly: number }
interface Tick { y: number; text: string }
interface XLabel { x: number; text: string; full: string }
interface Line { color: string; points: string; dots: { x: number; y: number; tip: string; label: string }[] }
interface Slice { d: string; color: string; tip: string; name: string; value: string; pct: string }

/** ตัวเลขแบบไทย ทศนิยมไม่เกิน 2 ตำแหน่ง */
function fmt(n: number): string {
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

/** ตัวเลขแบบย่อสำหรับแกนและป้ายบนแท่ง: ตั้งแต่ล้านขึ้นไปย่อ เช่น 4,850,000 → 4.85 ล้าน */
function short(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return fmt(Math.round((n / 1e6) * 100) / 100) + ' ล้าน';
  return fmt(n);
}

/** ระยะห่างของเส้นแกนที่ดูเป็นเลขกลม ๆ (1, 2, 2.5, 5 × 10^n) */
function niceStep(range: number, count: number): number {
  const raw = range / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const k = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return k * mag;
}

function cut(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : chars.slice(0, Math.max(1, max - 1)).join('') + '…';
}

@Component({
  selector: 'app-chart',
  template: `
    @let c = data();
    <figure class="chart">
      @if (c.title) {
        <figcaption class="title">{{ c.title }}</figcaption>
      }

      @if (c.kind === 'pie') {
        @if (slices().length) {
          <div class="pie">
            <svg viewBox="0 0 240 240" class="pie-svg" role="img" [attr.aria-label]="aria()">
              @for (s of slices(); track $index) {
                <path [attr.d]="s.d" [attr.fill]="s.color" stroke="#fff" stroke-width="1.5"><title>{{ s.tip }}</title></path>
              }
            </svg>
            <ul class="legend col">
              @for (s of slices(); track $index) {
                <li><i [style.background]="s.color"></i>{{ s.name }} <b>{{ s.pct }}</b> <span class="muted">({{ s.value }})</span></li>
              }
            </ul>
          </div>
        } @else {
          <p class="empty">ไม่มีตัวเลขให้แสดงเป็นกราฟ</p>
        }
      } @else {
        @let g = grid();
        <div class="scroll">
          <svg [attr.viewBox]="'0 0 ' + g.width + ' ' + H" [style.min-width.px]="g.width > 640 ? g.width : null"
            role="img" [attr.aria-label]="aria()">
            @for (t of g.ticks; track $index) {
              <line [attr.x1]="M.left" [attr.x2]="g.width - M.right" [attr.y1]="t.y" [attr.y2]="t.y" class="grid" />
              <text [attr.x]="M.left - 8" [attr.y]="t.y + 4" class="tick" text-anchor="end">{{ t.text }}</text>
            }
            <line [attr.x1]="M.left" [attr.x2]="g.width - M.right" [attr.y1]="g.zeroY" [attr.y2]="g.zeroY" class="axis" />
            @for (l of g.xLabels; track $index) {
              <text [attr.x]="l.x" [attr.y]="H - M.bottom + 18" class="xl" text-anchor="middle">{{ l.text }}<title>{{ l.full }}</title></text>
            }

            @if (c.kind === 'bar') {
              @for (b of bars(); track $index) {
                <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.fill]="b.color" rx="2"><title>{{ b.tip }}</title></rect>
                @if (b.label) {
                  <text [attr.x]="b.lx" [attr.y]="b.ly" class="val" text-anchor="middle">{{ b.label }}</text>
                }
              }
            } @else {
              @for (l of lines(); track $index) {
                <polyline [attr.points]="l.points" [attr.stroke]="l.color" class="line" />
                @for (d of l.dots; track $index) {
                  <circle [attr.cx]="d.x" [attr.cy]="d.y" r="4" [attr.fill]="l.color" class="dot"><title>{{ d.tip }}</title></circle>
                  @if (d.label) {
                    <text [attr.x]="d.x" [attr.y]="d.y - 9" class="val" text-anchor="middle">{{ d.label }}</text>
                  }
                }
              }
            }
          </svg>
        </div>
        @if (c.series.length > 1) {
          <ul class="legend">
            @for (s of c.series; track $index) {
              <li><i [style.background]="color($index)"></i>{{ s.name }}</li>
            }
          </ul>
        }
      }
    </figure>
  `,
  styles: `
    :host { display: block; }
    .chart { margin: 4px 0 20px; padding: 14px 14px 10px; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; }
    .title { font-weight: 600; color: var(--blue-900); margin-bottom: 6px; font-size: 15px; }
    .scroll { overflow-x: auto; }
    svg { display: block; width: 100%; height: auto; font-family: inherit; }
    .grid { stroke: #e2e8f0; stroke-width: 1; }
    .axis { stroke: #94a3b8; stroke-width: 1; }
    .tick { font-size: 11px; fill: #64748b; }
    .xl { font-size: 12px; fill: #334155; }
    .val { font-size: 11px; fill: #0f172a; font-weight: 600; }
    .line { fill: none; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
    .dot { stroke: #fff; stroke-width: 1.5; }
    .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 8px 0 0; padding: 0; font-size: 14px; }
    .legend.col { flex-direction: column; margin: 0; }
    .legend li { display: flex; align-items: center; gap: 6px; }
    .legend i { width: 12px; height: 12px; border-radius: 3px; flex: none; }
    .muted { color: var(--ink-2); font-size: 13px; }
    .pie { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .pie-svg { width: 220px; max-width: 100%; flex: none; }
    .empty { margin: 0; color: var(--ink-2); font-size: 14px; }
  `,
})
export class Chart {
  data = input.required<ChartBlock>();
  H = H;
  M = M;

  color(i: number) {
    return COLORS[i % COLORS.length];
  }

  aria = computed(() => {
    const c = this.data();
    const kind = c.kind === 'pie' ? 'กราฟวงกลม' : c.kind === 'line' ? 'กราฟเส้น' : 'กราฟแท่ง';
    return `${kind} ${c.title || ''} ${c.series.map((s) => s.name).join(', ')}`.trim();
  });

  /** แกน: ความกว้าง สเกล เส้นแบ่ง และป้ายแกนนอน */
  grid = computed(() => {
    const c = this.data();
    const n = c.labels.length;
    const perGroup = c.kind === 'bar' ? Math.max(48, c.series.length * 22 + 16) : 56;
    const width = Math.max(640, M.left + M.right + n * perGroup);
    const plotW = width - M.left - M.right;
    const plotH = H - M.top - M.bottom;

    const all = c.series.flatMap((s) => s.values).filter((v): v is number => typeof v === 'number');
    let max = Math.max(0, ...all);
    let min = Math.min(0, ...all);
    if (max === min) max = min + 1;
    const step = niceStep(max - min, 5);
    max = Math.ceil(max / step) * step;
    min = Math.floor(min / step) * step;
    const y = (v: number) => M.top + ((max - v) / (max - min)) * plotH;

    const ticks: Tick[] = [];
    for (let v = min; v <= max + step / 2; v += step) {
      const r = Math.round(v * 1e6) / 1e6;
      ticks.push({ y: y(r), text: short(r) });
    }

    const band = plotW / Math.max(1, n);
    const maxChars = Math.max(3, Math.floor(band / 8));
    const xLabels: XLabel[] = c.labels.map((full, i) => ({ x: M.left + band * (i + 0.5), text: cut(full, maxChars), full }));

    return { width, band, y, zeroY: y(0), ticks, xLabels };
  });

  bars = computed<Bar[]>(() => {
    const c = this.data();
    const g = this.grid();
    const k = c.series.length;
    const inner = g.band * 0.75;
    const w = Math.min(40, inner / k);
    const showVal = c.labels.length * k <= 24;
    const out: Bar[] = [];
    c.labels.forEach((label, i) => {
      const start = M.left + g.band * i + (g.band - w * k) / 2;
      c.series.forEach((s, j) => {
        const v = s.values[i];
        if (typeof v !== 'number') return;
        const top = Math.min(g.y(v), g.zeroY);
        const h = Math.max(1, Math.abs(g.y(v) - g.zeroY));
        const x = start + j * w;
        out.push({
          x: x + 1, y: top, w: Math.max(2, w - 2), h, color: this.color(j),
          tip: `${label} · ${s.name}: ${fmt(v)}`,
          label: showVal ? short(v) : '',
          lx: x + w / 2, ly: v >= 0 ? top - 5 : top + h + 13,
        });
      });
    });
    return out;
  });

  lines = computed<Line[]>(() => {
    const c = this.data();
    const g = this.grid();
    const showVal = c.labels.length <= 12 && c.series.length <= 3;
    return c.series.map((s, j) => {
      const dots = s.values
        .map((v, i) => (typeof v === 'number'
          ? { x: M.left + g.band * (i + 0.5), y: g.y(v), tip: `${c.labels[i]} · ${s.name}: ${fmt(v)}`, label: showVal ? short(v) : '' }
          : null))
        .filter((d): d is NonNullable<typeof d> => d !== null);
      return { color: this.color(j), points: dots.map((d) => `${d.x},${d.y}`).join(' '), dots };
    });
  });

  slices = computed<Slice[]>(() => {
    const c = this.data();
    const s = c.series[0];
    if (!s) return [];
    const items = c.labels
      .map((name, i) => ({ name, v: s.values[i] }))
      .filter((x): x is { name: string; v: number } => typeof x.v === 'number' && x.v > 0);
    const total = items.reduce((a, x) => a + x.v, 0);
    if (!total) return [];
    const cx = 120, cy = 120, r = 110;
    let angle = -Math.PI / 2;
    return items.map((x, i) => {
      const frac = x.v / total;
      const a2 = angle + frac * Math.PI * 2;
      let d: string;
      if (items.length === 1) {
        d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
      } else {
        const p1 = [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
        const p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
        d = `M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${p2[0]} ${p2[1]} Z`;
      }
      angle = a2;
      const pct = fmt(Math.round(frac * 1000) / 10) + '%';
      return { d, color: this.color(i), tip: `${x.name}: ${fmt(x.v)} (${pct})`, name: x.name, value: fmt(x.v), pct };
    });
  });
}
