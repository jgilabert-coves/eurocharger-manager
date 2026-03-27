import { tk } from './tokens';
import { IcUsers, IcPlug } from './icons';
import { Card } from './primitives';

type TopListItem = {
  name: string;
  recargas: number;
  euros: string;
};

type TopListProps = {
  title: string;
  items: TopListItem[];
  isClient?: boolean;
};

const trophies = ['🥇', '🥈', '🥉', ''];

export function TopList({ title, items, isClient }: TopListProps) {
  const Icon = isClient ? IcUsers : IcPlug;

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} color={tk.inkDarkest} />
          <span style={{ fontSize: 11, fontWeight: 600, color: tk.inkDarkest }}>{title}</span>
        </div>
        <div style={{ fontSize: 9, color: tk.inkLighter }}>Últimas 24 horas</div>
      </div>
      {items.map(({ name, recargas, euros }, i) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
            borderBottom: `0.5px solid ${tk.skyLight}`,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: tk.greenLightest,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: tk.greenDarkest,
              flexShrink: 0,
            }}
          >
            {isClient
              ? name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
              : 'EC'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tk.inkDarkest }}>{name}</div>
            <div style={{ fontSize: 9, color: tk.inkLighter }}>
              ↻ {recargas} recargas · ≈ {euros} €
            </div>
          </div>
          <span style={{ fontSize: 13 }}>{trophies[i] || ''}</span>
        </div>
      ))}
    </Card>
  );
}
