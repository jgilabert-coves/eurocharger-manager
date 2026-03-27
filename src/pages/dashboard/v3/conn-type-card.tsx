import { tk } from './tokens';
import { IcPlug } from './icons';
import { Card, CardTitle } from './primitives';
import { CONN_TYPES } from './data';

export function ConnTypeCard() {
  return (
    <Card>
      <CardTitle icon={IcPlug} label="Tipo de conectores" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {CONN_TYPES.map(({ label, total, inUse, c, bg, desc }) => {
          const pct = Math.round((inUse / total) * 100);
          return (
            <div key={label} style={{ background: bg, borderRadius: 8, padding: '10px 12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: tk.inkDarkest }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: tk.inkDarkest }}>
                  {inUse}
                  <span style={{ fontSize: 10, fontWeight: 400, color: tk.inkLighter }}>
                    /{total}
                  </span>
                </span>
              </div>
              <div style={{ fontSize: 9, color: tk.inkLighter, marginBottom: 8 }}>{desc}</div>
              <div
                style={{
                  height: 4,
                  background: tk.white,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: c,
                    borderRadius: 10,
                  }}
                />
              </div>
              <div style={{ fontSize: 9, color: c, fontWeight: 600, marginTop: 4 }}>
                {pct}% en uso
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
