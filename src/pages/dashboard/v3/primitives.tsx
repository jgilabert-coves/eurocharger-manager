import type { CSSProperties, ReactNode } from 'react';

import { tk } from './tokens';

// ----------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: tk.white,
        border: `0.5px solid ${tk.skyLight}`,
        borderRadius: 10,
        padding: '12px 14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------
// Pill
// ----------------------------------------------------------------------

export function Pill({
  label,
  bg,
  color,
  dot,
}: {
  label: string;
  bg: string;
  color: string;
  dot: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        padding: '3px 9px',
        borderRadius: 20,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: dot,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

// ----------------------------------------------------------------------
// CardTitle
// ----------------------------------------------------------------------

export function CardTitle({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size: number; color?: string }>;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Icon size={13} color={tk.inkDarkest} />
      <span style={{ fontSize: 11, fontWeight: 600, color: tk.inkDarkest }}>{label}</span>
    </div>
  );
}

// ----------------------------------------------------------------------
// Badge
// ----------------------------------------------------------------------

export function Badge({
  value,
  bg,
  color,
}: {
  value: string;
  bg: string;
  color: string;
}) {
  return (
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
      {value}
    </span>
  );
}
