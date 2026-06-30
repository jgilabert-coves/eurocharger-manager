import type { IconProps, IconWeight } from '@phosphor-icons/react';

// ----------------------------------------------------------------------

type PhosphorIconProps = {
  icon: React.ComponentType<IconProps>;
  size?: number;
  weight?: IconWeight;
  color?: string;
};

/**
 * Thin wrapper around @phosphor-icons/react.
 * Import icons from '@phosphor-icons/react' (NOT from '/dist/csr/...').
 *
 * @example
 * import { Trash, X, PencilSimple } from '@phosphor-icons/react';
 * <PhosphorIcon icon={Trash} size={18} />
 * <PhosphorIcon icon={X} size={16} weight="bold" />
 */
export function PhosphorIcon({
  icon: Icon,
  size = 20,
  weight = 'regular',
  color = 'currentColor',
}: PhosphorIconProps) {
  return (
    <Icon size={size} weight={weight} color={color} style={{ display: 'block', flexShrink: 0 }} />
  );
}
