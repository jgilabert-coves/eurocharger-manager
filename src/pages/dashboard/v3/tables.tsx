import { tk } from './tokens';
import { IcBolt, IcCoin } from './icons';
import { Card, CardTitle } from './primitives';
import { IN_USE, TRANSACTIONS } from './data';

const thStyle: React.CSSProperties = {
  fontSize: 9,
  color: tk.skyDark,
  fontWeight: 600,
  textAlign: 'left',
  paddingBottom: 6,
  borderBottom: `0.5px solid ${tk.skyLight}`,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  fontSize: 11,
  color: tk.inkDarkest,
  padding: '6px 0',
};

export function InUseTable() {
  return (
    <Card>
      <CardTitle icon={IcBolt} label="Cargadores en uso" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['ID', 'Cargador', 'Ciudad', 'Conectores'].map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IN_USE.map(({ id, name, city, conn, full }) => (
            <tr key={id}>
              <td style={{ ...tdStyle, fontSize: 10, color: tk.inkLighter }}>{id}</td>
              <td style={tdStyle}>{name}</td>
              <td style={tdStyle}>{city}</td>
              <td style={{ padding: '6px 0' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: full ? tk.blueDarkest : tk.greenLightest,
                    color: full ? tk.white : tk.greenDarkest,
                  }}
                >
                  {conn}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function TransTable() {
  return (
    <Card>
      <CardTitle icon={IcCoin} label="Transacciones en curso" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['ID', 'Usuario', 'Ciudad', 'Estado'].map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TRANSACTIONS.map(({ id, user, city }) => (
            <tr key={id}>
              <td style={{ ...tdStyle, fontSize: 10, color: tk.inkLighter }}>{id}</td>
              <td style={tdStyle}>{user}</td>
              <td style={tdStyle}>{city}</td>
              <td style={{ padding: '6px 0' }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: tk.greenLightest,
                    color: tk.greenDarkest,
                  }}
                >
                  Cargando
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
