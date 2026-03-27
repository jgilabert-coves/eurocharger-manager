import { tk } from './tokens';
import { IcPlug } from './icons';
import { Card, CardTitle } from './primitives';
import { CHARGER_STATES } from './data';

export function ChargersCard() {
  const total = CHARGER_STATES.reduce((s, c) => s + c.v, 0);
  const available = CHARGER_STATES.find((s) => s.l === 'Disponibles')!.v;
  const availPct = Math.round((available / total) * 100);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardTitle icon={IcPlug} label="Cargadores" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          marginBottom: 14,
        }}
      >
        {CHARGER_STATES.map(({ l, v, c, bg }) => {
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
            <div key={l}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 10, color: tk.inkDarkest }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: tk.inkDarkest }}>
                  {v}
                  <span style={{ fontSize: 10, fontWeight: 400, color: tk.inkLighter }}>
                    /{total}
                  </span>
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: bg,
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
                    opacity: v === 0 ? 0.3 : 1,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          paddingTop: 10,
          borderTop: `0.5px solid ${tk.skyLight}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: tk.inkLighter, fontWeight: 600 }}>
            Total cargadores
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: tk.inkDarkest }}>{total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: tk.inkLighter }}>Disponibilidad</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: tk.greenDarkest }}>
            {availPct}%
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: tk.skyLight,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${availPct}%`,
              height: '100%',
              background: tk.green,
              borderRadius: 10,
            }}
          />
        </div>
      </div>
    </Card>
  );
}
