import { useState } from 'react';

import { tk, badgeColors } from './tokens';
import { IcChart } from './icons';
import { Card } from './primitives';
import {
  PERIODS,
  STATS_BY_PERIOD,
  EMPTY_PERIOD,
  getCustomPeriodData,
  type Period,
} from './data';

export function StatsCard() {
  const [sel, setSel] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('Semana');
  const [showCustom, setShowCustom] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const periodData =
    period === 'Periodo'
      ? getCustomPeriodData(dateFrom, dateTo) || EMPTY_PERIOD
      : STATS_BY_PERIOD[period];
  const statsData = periodData.data;
  const xLabels = periodData.labels;
  const active = statsData[sel];
  const lineData = active.line;
  const N = lineData.length;
  const NL = xLabels.length;
  const W = 180;
  const H = 44;
  const PAD = 4;
  const xPt = (i: number) => (i + 0.5) * (W / N);
  const pts = lineData.map((v, i) => `${xPt(i)},${H - PAD - v}`).join(' ');
  const areaD =
    lineData.reduce(
      (a, v, i) => a + (i === 0 ? `M${xPt(0)},${H - PAD - v}` : `L${xPt(i)},${H - PAD - v}`),
      ''
    ) + ` L${W},${H - PAD - lineData[N - 1]} L${W},${H} L0,${H} L0,${H - PAD - lineData[0]} Z`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N))));
  };

  const hX = hover !== null ? xPt(hover) : null;
  const hY = hover !== null ? H - PAD - lineData[hover] : null;
  const hLabelIdx = hover !== null ? Math.round((hover * (NL - 1)) / (N - 1)) : null;
  const hLabelRaw = hLabelIdx !== null ? xLabels[hLabelIdx] : null;
  const hLabel = hLabelRaw === '' ? String(hover).padStart(2, '0') : hLabelRaw;

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IcChart size={13} color={tk.inkDarkest} />
          <span style={{ fontSize: 11, fontWeight: 600, color: tk.inkDarkest }}>Estadísticas</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: tk.skyLighter,
            borderRadius: 8,
            padding: '2px 3px',
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                setShowCustom(p === 'Periodo');
                setHover(null);
              }}
              style={{
                fontSize: 9,
                fontWeight: period === p ? 600 : 400,
                padding: '3px 7px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: period === p ? tk.white : 'transparent',
                color: period === p ? tk.inkDarkest : tk.inkLighter,
                boxShadow: period === p ? `0 0 0 0.5px ${tk.skyLight}` : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            padding: '7px 10px',
            background: tk.skyLighter,
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 9, color: tk.inkLighter }}>Desde</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setHover(null);
            }}
            style={{
              fontSize: 9,
              border: `0.5px solid ${tk.skyLight}`,
              borderRadius: 6,
              padding: '3px 6px',
              color: tk.inkDarkest,
              background: tk.white,
            }}
          />
          <span style={{ fontSize: 9, color: tk.inkLighter }}>Hasta</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setHover(null);
            }}
            style={{
              fontSize: 9,
              border: `0.5px solid ${tk.skyLight}`,
              borderRadius: 6,
              padding: '3px 6px',
              color: tk.inkDarkest,
              background: tk.white,
            }}
          />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {statsData.map(({ label, v, delta }, i) => {
          const { bg, color } = badgeColors(delta);
          return (
            <div
              key={label}
              onClick={() => {
                setSel(i);
                setHover(null);
              }}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                background: sel === i ? tk.skyLighter : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: tk.inkLighter, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: tk.inkDarkest, marginBottom: 4 }}>
                {v}
              </div>
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontWeight: 600,
                  background: bg,
                  color,
                }}
              >
                {delta}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'relative' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: H, display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sg-stats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active.lineColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={active.lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#sg-stats)" />
          <polyline
            points={`0,${H - PAD - lineData[0]} ${pts} ${W},${H - PAD - lineData[N - 1]}`}
            fill="none"
            stroke={active.lineColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {hover !== null && hX !== null && hY !== null && (
            <>
              <line
                x1={hX}
                y1={0}
                x2={hX}
                y2={H}
                stroke={tk.skyBase}
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <circle cx={hX} cy={hY} r="1.5" fill={active.lineColor} />
            </>
          )}
        </svg>
        {hover !== null && hX !== null && hY !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(85, Math.max(0, (hX / W) * 100 - 10))}%`,
              top: `${Math.max(0, ((hY - 30) / H) * 100)}%`,
              background: tk.inkDarkest,
              color: tk.white,
              fontSize: 9,
              fontWeight: 600,
              padding: '3px 7px',
              borderRadius: 6,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: 'translateY(-100%)',
            }}
          >
            {hLabel}: {active.fmt(active.dayVals[hover])}
          </div>
        )}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${NL},1fr)`, marginTop: 4 }}
      >
        {xLabels.map((d, i) => {
          const hi = hover !== null ? Math.round((hover * (NL - 1)) / (N - 1)) : null;
          return (
            <span
              key={`${d}-${i}`}
              style={{
                fontSize: 8,
                textAlign: 'center',
                color: hi === i ? active.lineColor : tk.skyDark,
                fontWeight: hi === i ? 700 : 400,
              }}
            >
              {d}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
