type ConnectorTypeIconProps = {
  name?: string | null;
  size?: number;
};

type ConnectorType = 'mennekes' | 'ccs' | 'chademo' | 'schuko' | 'generic' | 'not_assigned';

function resolveType(name: string | null | undefined): ConnectorType {
  if (!name) return 'not_assigned';
  const lower = name.toLowerCase();
  if (lower.includes('mennekes') || lower.includes('type2') || lower.includes('type 2') || lower.includes('iec62196-t2')) return 'mennekes';
  if (lower.includes('ccs') || lower.includes('combo2') || lower.includes('combo 2')) return 'ccs';
  if (lower.includes('chademo')) return 'chademo';
  if (lower.includes('schuko') || lower.includes('type f') || lower.includes('typef')) return 'schuko';
  return 'generic';
}

export function ConnectorTypeIcon({ name, size = 24 }: ConnectorTypeIconProps) {
  const type = resolveType(name);

  if (type === 'mennekes') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="6.5" r="1.35" fill="currentColor" />
        <circle cx="16.5" cy="9" r="1.35" fill="currentColor" />
        <circle cx="16.5" cy="14.5" r="1.35" fill="currentColor" />
        <circle cx="12" cy="17" r="1.35" fill="currentColor" />
        <circle cx="7.5" cy="14.5" r="1.35" fill="currentColor" />
        <circle cx="7.5" cy="9" r="1.35" fill="currentColor" />
        <circle cx="12" cy="12" r="1.35" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'ccs') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="5.2" r="1.1" fill="currentColor" />
        <circle cx="14.8" cy="6.8" r="1.1" fill="currentColor" />
        <circle cx="14.8" cy="10.2" r="1.1" fill="currentColor" />
        <circle cx="12" cy="11.8" r="1.1" fill="currentColor" />
        <circle cx="9.2" cy="10.2" r="1.1" fill="currentColor" />
        <circle cx="9.2" cy="6.8" r="1.1" fill="currentColor" />
        <circle cx="12" cy="8.5" r="1.1" fill="currentColor" />
        <rect x="7" y="15.5" width="10" height="5" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9.8" cy="18" r="1.1" fill="currentColor" />
        <circle cx="14.2" cy="18" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'chademo') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="7.8" cy="8.8" r="1.7" fill="currentColor" />
        <circle cx="16.2" cy="8.8" r="1.7" fill="currentColor" />
        <circle cx="7.8" cy="15.2" r="1.7" fill="currentColor" />
        <circle cx="16.2" cy="15.2" r="1.7" fill="currentColor" />
        <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'schuko') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="12" r="1.4" fill="currentColor" />
        <circle cx="15.5" cy="12" r="1.4" fill="currentColor" />
        <path
          d="M9 16.5 Q12 18.5 15 16.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  if (type === 'not_assigned') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2.5" />
        <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="10.5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="14.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
