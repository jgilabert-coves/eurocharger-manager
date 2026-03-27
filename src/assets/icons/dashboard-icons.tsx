import type { SvgIconProps } from '@mui/material/SvgIcon';

import { forwardRef } from 'react';

import SvgIcon from '@mui/material/SvgIcon';

// ----------------------------------------------------------------------

export const IcGrid = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <rect x="1" y="1" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="8" y="1" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="1" y="8" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="8" y="8" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
  </SvgIcon>
));

export const IcBolt = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M9 1L3.5 7.5H7.5L5 13L11.5 6H7.5L9 1Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </SvgIcon>
));

export const IcPlug = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M2 10V6.5a5 5 0 0 1 10 0V10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <rect x="1" y="9.5" width="2.5" height="3.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="10.5" y="9.5" width="2.5" height="3.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
  </SvgIcon>
));

export const IcAlert = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M7 1.5L1.5 12h11L7 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M7 5.5v3M7 10h.01" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcCoin = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 4v6M5.5 5.5h2a1 1 0 0 1 0 2h-1a1 1 0 0 0 0 2H8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </SvgIcon>
));

export const IcChart = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M1.5 11L5 6.5l2.5 2.5L10 4l2.5 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
));

export const IcUsers = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="5" cy="4.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="9.5" cy="4.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1 12c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5M9 9c.15-.01.3-.02.5-.02C11.4 9 13 10.3 13 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcSettings = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcSignal = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M1 11c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M3.5 8.5C4.8 7.2 6 6.5 7 6.5s2.2.7 3.5 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="7" cy="6" r="1" fill="currentColor" />
  </SvgIcon>
));

export const IcClock = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 3.5V7l2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcWrench = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <path d="M8.5 2a3.5 3.5 0 0 1 0 5L4 11.5A1.5 1.5 0 0 1 2 9.5L6.5 5a3.5 3.5 0 0 1 2-3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9.5 3.5l1 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcTotal = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4 7h6M7 4v6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </SvgIcon>
));

export const IcMenunekes = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="currentColor" opacity="0.15" />
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="7" cy="4.2" r="0.85" fill="currentColor" />
    <circle cx="9.4" cy="5.5" r="0.85" fill="currentColor" />
    <circle cx="9.4" cy="8.2" r="0.85" fill="currentColor" />
    <circle cx="7" cy="9.5" r="0.85" fill="currentColor" />
    <circle cx="4.6" cy="8.2" r="0.85" fill="currentColor" />
    <circle cx="4.6" cy="5.5" r="0.85" fill="currentColor" />
    <circle cx="7" cy="7" r="0.85" fill="currentColor" />
  </SvgIcon>
));

export const IcCCS = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="5.5" r="3.8" fill="currentColor" opacity="0.15" />
    <circle cx="7" cy="5.5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="7" cy="3.2" r="0.75" fill="currentColor" />
    <circle cx="8.9" cy="4.2" r="0.75" fill="currentColor" />
    <circle cx="8.9" cy="6.2" r="0.75" fill="currentColor" />
    <circle cx="7" cy="7.2" r="0.75" fill="currentColor" />
    <circle cx="5.1" cy="6.2" r="0.75" fill="currentColor" />
    <circle cx="5.1" cy="4.2" r="0.75" fill="currentColor" />
    <circle cx="7" cy="5.5" r="0.75" fill="currentColor" />
    <rect x="4" y="10" width="6" height="3" rx="1.2" fill="currentColor" opacity="0.15" />
    <rect x="4" y="10" width="6" height="3" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="5.5" cy="11.5" r="0.7" fill="currentColor" />
    <circle cx="8.5" cy="11.5" r="0.7" fill="currentColor" />
  </SvgIcon>
));

export const IcChademo = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="currentColor" opacity="0.15" />
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="4.8" cy="5.2" r="1.1" fill="currentColor" />
    <circle cx="9.2" cy="5.2" r="1.1" fill="currentColor" />
    <circle cx="4.8" cy="8.8" r="1.1" fill="currentColor" />
    <circle cx="9.2" cy="8.8" r="1.1" fill="currentColor" />
    <circle cx="7" cy="7" r="0.7" fill="currentColor" />
  </SvgIcon>
));

export const IcSchuko = forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => (
  <SvgIcon ref={ref} viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="5.5" fill="currentColor" opacity="0.15" />
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="5.5" cy="7" r="1" fill="currentColor" />
    <circle cx="8.5" cy="7" r="1" fill="currentColor" />
  </SvgIcon>
));
