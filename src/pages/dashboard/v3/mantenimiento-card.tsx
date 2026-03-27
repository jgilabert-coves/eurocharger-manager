import { tk } from './tokens';
import { IcWrench } from './icons';
import { Card, CardTitle } from './primitives';
import { MANT } from './data';

export function MantenimientoCard() {
  return (
    <Card>
      <CardTitle icon={IcWrench} label="Mantenimiento" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {MANT.map(({ label, v, delta, up }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: tk.inkLighter, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: tk.inkDarkest, marginBottom: 3 }}>
              {v}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color:
                  up === false ? tk.redBase : up ? tk.greenDarkest : tk.inkLighter,
              }}
            >
              {delta}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        style={{
          width: '100%',
          padding: '9px 0',
          background: tk.inkDarkest,
          color: tk.white,
          fontSize: 11,
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          letterSpacing: 0.3,
        }}
      >
        Planificar mantenimiento
      </button>
    </Card>
  );
}
