import { tk } from './tokens';
import { IcSignal, IcTotal, IcMenunekes, IcCCS, IcChademo, IcSchuko } from './icons';
import { Card, CardTitle } from './primitives';
import { CONECTORES } from './data';

const ICON_MAP = {
  total: IcTotal,
  mennekes: IcMenunekes,
  ccs: IcCCS,
  chademo: IcChademo,
  schuko: IcSchuko,
} as const;

function deltaColor(up: boolean | null) {
  if (up === false) return tk.redBase;
  if (up) return tk.greenDarkest;
  return tk.inkLighter;
}

export function ConectoresCard() {
  return (
    <Card>
      <CardTitle icon={IcSignal} label="Conectores" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
        {CONECTORES.map(({ label, iconKey }) => {
          const Icon = ICON_MAP[iconKey];
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                paddingBottom: 8,
              }}
            >
              <Icon size={16} color={tk.inkDark} />
              <div
                style={{ fontSize: 9, color: tk.inkLighter, textAlign: 'center', lineHeight: 1.2 }}
              >
                {label}
              </div>
            </div>
          );
        })}

        <div
          style={{
            gridColumn: '1/-1',
            background: tk.skyLighter,
            borderRadius: 6,
            padding: '3px 8px',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: tk.inkLight }}>Disponibilidad</span>
        </div>

        {CONECTORES.map(({ label, avail, avDelta, avUp }) => (
          <div key={`${label}-av`} style={{ textAlign: 'center', paddingBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tk.inkDarkest }}>{avail}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: deltaColor(avUp) }}>{avDelta}</div>
          </div>
        ))}

        <div
          style={{
            gridColumn: '1/-1',
            background: tk.skyLighter,
            borderRadius: 6,
            padding: '3px 8px',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: tk.inkLight }}>Ocupación</span>
        </div>

        {CONECTORES.map(({ label, occ, ocDelta, ocUp }) => (
          <div key={`${label}-oc`} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tk.inkDarkest }}>{occ}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: deltaColor(ocUp) }}>{ocDelta}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
