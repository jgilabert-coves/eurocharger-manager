import { tk } from './tokens';
import { IcBolt } from './icons';
import { Card, CardTitle } from './primitives';

type SparkCardProps = {
  title: string;
  value: string;
  sub: string;
  delta: string;
  up: boolean;
  spark: string;
  color: string;
};

export function SparkCard({ title, value, sub, delta, up, spark, color }: SparkCardProps) {
  return (
    <Card>
      <CardTitle icon={IcBolt} label={title} />
      <div
        style={{
          fontSize: 10,
          color: up ? tk.greenDarkest : tk.redDarkest,
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        {up ? '▲' : '▼'} {delta} comparado con ayer
      </div>
      <div style={{ fontSize: 9, color: tk.inkLighter, marginBottom: 10 }}>Últimas 24 horas</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: tk.inkDarkest, marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: tk.inkLighter, marginBottom: 10 }}>{sub}</div>
      <svg viewBox="0 0 90 36" style={{ width: '100%', height: 36 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${spark} L90,36 L0,36 Z`} fill={`url(#sg-${title})`} />
        <path d={spark} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </Card>
  );
}
