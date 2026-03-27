import { tk } from './tokens';
import { Pill } from './primitives';

export function Topbar() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{
        background: tk.white,
        borderBottom: `0.5px solid ${tk.skyLight}`,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: tk.inkDarkest }}>Panel de control</div>
        <div style={{ fontSize: 10, color: tk.inkLighter, marginTop: 1 }}>
          {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Pill label="Red operativa" bg={tk.greenLightest} color={tk.greenDarkest} dot={tk.green} />
        <Pill
          label="3 alertas"
          bg={tk.yellowLightest}
          color={tk.yellowDarkest}
          dot={tk.yellowBase}
        />
      </div>
    </div>
  );
}
