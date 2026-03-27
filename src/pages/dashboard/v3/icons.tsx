import type { CSSProperties } from 'react';

type IconProps = {
  size: number;
  color?: string;
  style?: CSSProperties;
};

export function IcGrid({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IcBolt({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M9 1L3.5 7.5H7.5L5 13L11.5 6H7.5L9 1Z" stroke={color || 'currentColor'} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function IcPlug({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color || 'currentColor'}>
      <path d="M2 10V6.5a5 5 0 0 1 10 0V10" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="1" y="9.5" width="2.5" height="3.5" rx="1" strokeWidth="1.3" />
      <rect x="10.5" y="9.5" width="2.5" height="3.5" rx="1" strokeWidth="1.3" />
    </svg>
  );
}

export function IcAlert({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L1.5 12h11L7 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 5.5v3M7 10h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcCoin({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 4v6M5.5 5.5h2a1 1 0 0 1 0 2h-1a1 1 0 0 0 0 2H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IcChart({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1.5 11L5 6.5l2.5 2.5L10 4l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcUsers({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color || 'currentColor'}>
      <circle cx="5" cy="4.5" r="2" strokeWidth="1.3" />
      <circle cx="9.5" cy="4.5" r="2" strokeWidth="1.3" />
      <path d="M1 12c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5M9 9c.15-.01.3-.02.5-.02C11.4 9 13 10.3 13 12" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcSettings({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcSignal({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 11c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5" stroke={color || 'currentColor'} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3.5 8.5C4.8 7.2 6 6.5 7 6.5s2.2.7 3.5 2" stroke={color || 'currentColor'} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7" cy="6" r="1" fill={color || 'currentColor'} />
    </svg>
  );
}

export function IcClock({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color || 'currentColor'} strokeWidth="1.3" />
      <path d="M7 3.5V7l2 2" stroke={color || 'currentColor'} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcWrench({ size, color }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M8.5 2a3.5 3.5 0 0 1 0 5L4 11.5A1.5 1.5 0 0 1 2 9.5L6.5 5a3.5 3.5 0 0 1 2-3z" stroke={color || 'currentColor'} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 3.5l1 1" stroke={color || 'currentColor'} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcTotal({ size, color }: IconProps) {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={c} strokeWidth="1.3" />
      <path d="M4 7h6M7 4v6" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IcMenunekes({ size, color }: IconProps) {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill={c} opacity="0.15" />
      <circle cx="7" cy="7" r="5.5" stroke={c} strokeWidth="1.1" />
      <circle cx="7" cy="4.2" r="0.85" fill={c} />
      <circle cx="9.4" cy="5.5" r="0.85" fill={c} />
      <circle cx="9.4" cy="8.2" r="0.85" fill={c} />
      <circle cx="7" cy="9.5" r="0.85" fill={c} />
      <circle cx="4.6" cy="8.2" r="0.85" fill={c} />
      <circle cx="4.6" cy="5.5" r="0.85" fill={c} />
      <circle cx="7" cy="7" r="0.85" fill={c} />
    </svg>
  );
}

export function IcCCS({ size, color }: IconProps) {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5.5" r="3.8" fill={c} opacity="0.15" />
      <circle cx="7" cy="5.5" r="3.8" stroke={c} strokeWidth="1.1" />
      <circle cx="7" cy="3.2" r="0.75" fill={c} />
      <circle cx="8.9" cy="4.2" r="0.75" fill={c} />
      <circle cx="8.9" cy="6.2" r="0.75" fill={c} />
      <circle cx="7" cy="7.2" r="0.75" fill={c} />
      <circle cx="5.1" cy="6.2" r="0.75" fill={c} />
      <circle cx="5.1" cy="4.2" r="0.75" fill={c} />
      <circle cx="7" cy="5.5" r="0.75" fill={c} />
      <rect x="4" y="10" width="6" height="3" rx="1.2" fill={c} opacity="0.15" />
      <rect x="4" y="10" width="6" height="3" rx="1.2" stroke={c} strokeWidth="1.1" />
      <circle cx="5.5" cy="11.5" r="0.7" fill={c} />
      <circle cx="8.5" cy="11.5" r="0.7" fill={c} />
    </svg>
  );
}

export function IcChademo({ size, color }: IconProps) {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill={c} opacity="0.15" />
      <circle cx="7" cy="7" r="5.5" stroke={c} strokeWidth="1.1" />
      <circle cx="4.8" cy="5.2" r="1.1" fill={c} />
      <circle cx="9.2" cy="5.2" r="1.1" fill={c} />
      <circle cx="4.8" cy="8.8" r="1.1" fill={c} />
      <circle cx="9.2" cy="8.8" r="1.1" fill={c} />
      <circle cx="7" cy="7" r="0.7" fill={c} />
    </svg>
  );
}

export function IcSchuko({ size, color }: IconProps) {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill={c} opacity="0.15" />
      <circle cx="7" cy="7" r="5.5" stroke={c} strokeWidth="1.1" />
      <circle cx="5.5" cy="7" r="1" fill={c} />
      <circle cx="8.5" cy="7" r="1" fill={c} />
    </svg>
  );
}
