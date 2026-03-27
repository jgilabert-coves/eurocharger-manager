import { tk } from './tokens';
import { IcClock } from './icons';
import { Card, CardTitle } from './primitives';
import { DAYS, HOURS, HEATMAP } from './data';

export function HeatmapCard() {
  const maxV = Math.max(...HEATMAP.flat());

  return (
    <Card>
      <CardTitle icon={IcClock} label="Horarios de afluencia" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px repeat(7,1fr)',
          gap: 3,
          alignItems: 'center',
        }}
      >
        <div />
        {DAYS.map((d) => (
          <div key={d} style={{ fontSize: 9, color: tk.skyDark, textAlign: 'center' }}>
            {d}
          </div>
        ))}
        {HEATMAP.map((row, ri) => [
          <div
            key={`l${ri}`}
            style={{ fontSize: 9, color: tk.skyDark, textAlign: 'right', paddingRight: 4 }}
          >
            {HOURS[ri]}
          </div>,
          ...row.map((v, ci) => {
            const p = v / maxV;
            const bg =
              p > 0.8
                ? tk.inkDark
                : p > 0.5
                  ? tk.inkLighter
                  : p > 0.3
                    ? tk.skyBase
                    : tk.skyLight;
            return <div key={`${ri}-${ci}`} style={{ height: 14, borderRadius: 3, background: bg }} />;
          }),
        ])}
      </div>
    </Card>
  );
}
