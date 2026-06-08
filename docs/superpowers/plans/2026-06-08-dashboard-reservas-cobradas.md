# Dashboard — Reservas Cobradas (rol eurocharger) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una tarjeta KPI con las reservas cobradas del día y una nueva serie "Reservas" en el gráfico de estadísticas, ambas visibles sólo para el rol `eurocharger`.

**Architecture:** El backend detecta el rol del JWT en el controlador y pasa `isEurocharger` al servicio, que añade condicionalmente la serie al endpoint `/dashboard/stats` existente y expone un nuevo endpoint `/dashboard/reservations/today`. El frontend comprueba el rol en `useAuthContext` y renderiza condicionalmente el KPI card y activa la query.

**Tech Stack:** Node.js / TypeScript / Express / MySQL2 (backend `eurocharger-api`) · React 18 / TanStack Query / MUI v6 (frontend `eurocharger-manager`)

---

## File Map

| Acción | Ruta |
|--------|------|
| Modify | `eurocharger-api/src/types/dashboard.types.ts:61` |
| Modify | `eurocharger-api/src/repositories/dashboard.repository.ts` (añadir método al final, antes de `}`) |
| Modify | `eurocharger-api/src/services/dashboard.service.ts:27-33, 209-221, 396-600` |
| Modify | `eurocharger-api/src/controllers/dashboard.controller.ts:209-230` |
| Modify | `eurocharger-api/src/routes/dashboard.routes.ts:31` |
| Modify | `eurocharger-manager/src/lib/axios.ts:128-129` |
| Modify | `eurocharger-manager/src/pages/dashboard/dashboard.tsx` |

---

## Task 1: Añadir `'reservations'` al tipo `StatsMetric` y al `formatValue`

**Files:**
- Modify: `eurocharger-api/src/types/dashboard.types.ts:61`
- Modify: `eurocharger-api/src/services/dashboard.service.ts:209-221`

- [ ] **Step 1: Ampliar el tipo `StatsMetric`**

En `eurocharger-api/src/types/dashboard.types.ts`, reemplazar la línea 61:

```typescript
// antes
export type StatsMetric = 'charges' | 'energy' | 'revenue' | 'users' | 'avg-charge-time';

// después
export type StatsMetric = 'charges' | 'energy' | 'revenue' | 'users' | 'avg-charge-time' | 'reservations';
```

- [ ] **Step 2: Añadir case a `formatValue` en el servicio**

En `eurocharger-api/src/services/dashboard.service.ts`, `formatValue` (línea ~209). Añadir el caso antes del cierre de la función:

```typescript
function formatValue(metric: StatsMetric, value: number): string {
  switch (metric) {
    case "charges":
    case "users":
    case "reservations":
      return formatNumber(Math.round(value));
    case "energy":
      return `${formatNumber(value)} kWh`;
    case "revenue":
      return `${formatNumber(value, { decimals: 2 })}€`;
    case "avg-charge-time":
      return formatTime(value);
  }
}
```

- [ ] **Step 3: Verificar compilación TypeScript**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-api
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-api
git add src/types/dashboard.types.ts src/services/dashboard.service.ts
git commit -m "feat: add 'reservations' to StatsMetric type and formatValue"
```

---

## Task 2: Método de repositorio `getReservationsPaidToday`

**Files:**
- Modify: `eurocharger-api/src/repositories/dashboard.repository.ts` (añadir antes del cierre de la clase `}`)

- [ ] **Step 1: Añadir el método al repositorio**

Al final de la clase `DashboardRepository` en `eurocharger-api/src/repositories/dashboard.repository.ts`, antes del último `}`:

```typescript
  static async getReservationsPaidToday(
    accountId: number | null,
    guestUserId: number | null = null,
  ): Promise<number> {
    try {
      const { filter: clientFilter, params } = buildChargerFilter(accountId, guestUserId);
      const sql = `
        SELECT COUNT(DISTINCT r.id) AS value
        FROM reservations r
        JOIN receipts rec ON rec.reservation_id = r.id AND rec.type_id = 2
        JOIN connectors conn ON conn.id = r.connector_id
        JOIN chargepoints c ON c.id = conn.chargepoint_id
        WHERE DATE(rec.created_at) = CURDATE()
          AND c.deleted_at IS NULL
          ${clientFilter}
      `;
      const [rows] = await db.query<RowOf<TotalRow>[]>(sql, params);
      return Number(rows[0]?.value ?? 0);
    } catch (error) {
      console.error("Error in getReservationsPaidToday:", error);
      return 0;
    }
  }
```

- [ ] **Step 2: Verificar compilación**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-api
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/dashboard.repository.ts
git commit -m "feat: add getReservationsPaidToday repository method"
```

---

## Task 3: Actualizar el servicio — serie del gráfico + método today

**Files:**
- Modify: `eurocharger-api/src/services/dashboard.service.ts`

### 3a — Añadir `reservations` a `METRIC_INFO`

- [ ] **Step 1: Añadir entrada en METRIC_INFO (línea ~27-33)**

```typescript
const METRIC_INFO: Record<StatsMetric, MetricInfo> = {
  charges: { label: "Recargas", color: "#4F46E5" },
  energy: { label: "Energía", color: "#10B981" },
  revenue: { label: "Ingresos", color: "#F59E0B" },
  users: { label: "Usuarios", color: "#EF4444" },
  "avg-charge-time": { label: "Tiempo medio", color: "#8B5CF6" },
  reservations: { label: "Reservas", color: "#0EA5E9" },
};
```

### 3b — Actualizar `_getStatsChartInner`

- [ ] **Step 2: Añadir parámetro `isEurocharger` a la firma (línea ~396)**

```typescript
private static async _getStatsChartInner(
  accountId: number | null,
  from: string,
  to: string,
  guestUserId: number | null = null,
  isEurocharger = false,
): Promise<StatsChartResponse> {
```

- [ ] **Step 3: Añadir bloque de setup de reservaciones justo después de la declaración de `usersQ` (~línea 460, antes del `Promise.all`)**

Insertar este bloque entre el setup de `usersQ` y el `Promise.all`:

```typescript
    // Reservaciones (solo eurocharger)
    const resFromJoin =
      "reservations r " +
      "JOIN receipts rec ON rec.reservation_id = r.id AND rec.type_id = 2 " +
      "JOIN connectors conn ON conn.id = r.connector_id " +
      "JOIN chargepoints c ON c.id = conn.chargepoint_id";

    let resClientFilter: string;
    let resClientParams: (string | number)[];
    if (guestUserId !== null) {
      resClientFilter = GUEST_CHARGER_FILTER;
      resClientParams = [guestUserId, guestUserId];
    } else if (accountId) {
      resClientFilter = "AND c.account_id = ?";
      resClientParams = [accountId];
    } else {
      resClientFilter = "AND c.account_id != 18";
      resClientParams = [];
    }

    const resRange = buildRange("rec.created_at", from, to);
    const resGroupedWhere = `rec.created_at >= ? AND rec.created_at < ? AND c.deleted_at IS NULL ${resClientFilter}`;
    const resGroupedParams: (string | number)[] = [
      ...resRange.groupParams,
      resRange.start,
      resRange.end,
      ...resClientParams,
    ];
    const resPrevParams: (string | number)[] = [
      resRange.prevStart,
      resRange.prevEnd,
      ...resClientParams,
    ];
```

- [ ] **Step 4: Mantener el `Promise.all` existente intacto; añadir queries condicionales DESPUÉS de él**

Tras la destructuración del `Promise.all` existente (después de `usersPrev,`), añadir:

```typescript
    let reservationsGrouped: { idx: number; value: number }[] = [];
    let reservationsPrev = 0;

    if (isEurocharger) {
      [reservationsGrouped, reservationsPrev] = await Promise.all([
        DashboardRepository.getGroupedMetric(
          "COUNT(DISTINCT r.id)",
          resFromJoin,
          resGroupedWhere,
          resRange.groupExpr,
          resGroupedParams,
        ),
        DashboardRepository.getMetricTotal(
          "COUNT(DISTINCT r.id)",
          resFromJoin,
          `rec.created_at >= ? AND rec.created_at < ? AND c.deleted_at IS NULL ${resClientFilter}`,
          resPrevParams,
        ),
      ]);
    }
```

- [ ] **Step 5: Añadir la serie de reservaciones al array `series` (al final de la construcción del array, antes de `return`)**

Tras el último `push` a `series` (o al final del array literal), añadir condicionalmente:

```typescript
    if (isEurocharger) {
      const reservationsDP = new Array<number>(resRange.slotCount).fill(0);
      for (const row of reservationsGrouped) {
        if (row.idx >= 0 && row.idx < resRange.slotCount)
          reservationsDP[row.idx] = row.value;
      }
      const reservationsTotalCurrent = reservationsDP.reduce((a, b) => a + b, 0);
      series.push({
        ...METRIC_INFO["reservations"],
        value: formatValue("reservations", reservationsTotalCurrent),
        delta: computeDelta(reservationsTotalCurrent, reservationsPrev),
        dataPoints: reservationsDP,
        formattedDataPoints: reservationsDP.map((v) => formatValue("reservations", v)),
      });
    }

    return { labels: txRange.labels, series };
```

### 3c — Actualizar `getStatsChart` y añadir `getReservationsPaidToday`

- [ ] **Step 6: Actualizar la firma y cache key de `getStatsChart` (línea ~589)**

```typescript
  static async getStatsChart(
    accountId: number | null,
    from: string,
    to: string,
    guestUserId: number | null = null,
    isEurocharger = false,
  ): Promise<StatsChartResponse> {
    return cached(
      `dash:${cacheScope(accountId, guestUserId)}:stats:${isEurocharger ? "ec:" : ""}${from}:${to}`,
      "stats",
      () => DashboardService._getStatsChartInner(accountId, from, to, guestUserId, isEurocharger),
    );
  }
```

- [ ] **Step 7: Añadir `getReservationsPaidToday` al servicio (después de `getStatsChart`, antes del `}` de la clase)**

```typescript
  static async getReservationsPaidToday(
    accountId: number | null,
    guestUserId: number | null = null,
  ): Promise<number> {
    return DashboardRepository.getReservationsPaidToday(accountId, guestUserId);
  }
```

- [ ] **Step 8: Verificar compilación**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-api
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 9: Commit**

```bash
git add src/services/dashboard.service.ts
git commit -m "feat: add reservations series to stats chart and getReservationsPaidToday service"
```

---

## Task 4: Controlador y ruta

**Files:**
- Modify: `eurocharger-api/src/controllers/dashboard.controller.ts`
- Modify: `eurocharger-api/src/routes/dashboard.routes.ts`

- [ ] **Step 1: Actualizar `getStatsChart` en el controlador para pasar `isEurocharger` (línea ~209)**

```typescript
  static async getStatsChart(req: Request, res: Response) {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    if (!from || !to) {
      res.status(400).json({
        status_code: 400,
        data: null,
        error: "Los parámetros 'from' y 'to' son obligatorios (formato YYYY-MM-DD)",
      });
      return;
    }

    const isEurocharger = req.roles?.includes("eurocharger") ?? false;
    const data = await DashboardService.getStatsChart(
      req.account_id,
      from,
      to,
      getGuestUserId(req),
      isEurocharger,
    );

    res.json({ status_code: 200, data, error: null });
  }
```

- [ ] **Step 2: Añadir `getReservationsPaidToday` al controlador (después de `getSummary`, antes del `}` de la clase)**

```typescript
  static async getReservationsPaidToday(req: Request, res: Response) {
    const total = await DashboardService.getReservationsPaidToday(
      req.account_id,
      getGuestUserId(req),
    );
    res.json({ status_code: 200, data: { total }, error: null });
  }
```

- [ ] **Step 3: Añadir la ruta en `dashboard.routes.ts` (antes del `export default`)**

```typescript
router.get(
  "/api/dashboard/reservations/today",
  authenticateJWT,
  requireRole("eurocharger"),
  DashboardController.getReservationsPaidToday,
);
```

- [ ] **Step 4: Verificar compilación**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-api
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 5: Probar el endpoint manualmente**

Con un token de usuario eurocharger:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/dashboard/reservations/today"
```

Expected:
```json
{ "status_code": 200, "data": { "total": <N> }, "error": null }
```

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/dashboard/stats?from=2026-06-01&to=2026-06-08"
```

Expected: la respuesta incluye un 6.º objeto en `data.series` con `label: "Reservas"`.

- [ ] **Step 6: Commit**

```bash
git add src/controllers/dashboard.controller.ts src/routes/dashboard.routes.ts
git commit -m "feat: add reservations/today endpoint and wire eurocharger series in getStatsChart"
```

---

## Task 5: Frontend — endpoint y KPI card

**Files:**
- Modify: `eurocharger-manager/src/lib/axios.ts:128`
- Modify: `eurocharger-manager/src/pages/dashboard/dashboard.tsx`

- [ ] **Step 1: Añadir `reservationsToday` a los endpoints (línea ~128 de `axios.ts`)**

```typescript
  dashboard: {
    activeUsers: '/dashboard/appusers/growth',
    activeTransactions: '/dashboard/charging-stats',
    transactionsData: '/dashboard/transactions',
    alarms: '/dashboard/alarms/growth',
    chargepoints: '/dashboard/chargepoints',
    revenue: '/dashboard/revenue-stats',
    stats: '/dashboard/stats',
    connectors: {
      metrics: 'dashboard/connectors/metrics',
      typesMetrics: 'dashboard/connectors/types/metrics',
    },
    topUsers: '/dashboard/top-users',
    topChargepoints: '/dashboard/top-chargepoints',
    activeCharges: '/dashboard/active-charges',
    heatmap: '/dashboard/heatmap',
    connectorCurrentTypes: '/dashboard/connectors/usage',
    reservationsToday: '/dashboard/reservations/today',
  },
```

- [ ] **Step 2: Actualizar `dashboard.tsx` — imports**

Añadir `useAuthContext` a los imports existentes (al principio del fichero):

```typescript
import { useAuthContext } from 'src/auth/hooks';
```

- [ ] **Step 3: Añadir query y constante de rol dentro del componente**

Tras las 4 queries existentes (después de `alarmsRes`), añadir:

```typescript
  const { user } = useAuthContext();
  const isEurocharger = user?.roles?.includes('eurocharger') ?? false;

  const { data: reservationsRes } = useQuery({
    queryKey: ['dashboard', 'reservationsToday'],
    queryFn: () => fetcher(endpoints.dashboard.reservationsToday),
    enabled: isEurocharger,
  });
```

- [ ] **Step 4: Renderizar la tarjeta KPI encima del grid existente**

Justo antes del bloque `{/* KPI Cards — 4 columns */}` (línea ~67), añadir:

```tsx
        {/* KPI Card exclusivo eurocharger */}
        {isEurocharger && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                title="Reservas cobradas hoy"
                value={reservationsRes ? formatNumber(reservationsRes.data.total) : '...'}
                subtitle="Reservas con cobro completado"
                icon="solar:calendar-date-bold"
                palette="info"
              />
            </Grid>
          </Grid>
        )}
```

- [ ] **Step 5: Verificar con lint**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-manager
yarn lint
```

Expected: sin errores (o corregir con `yarn lint:fix`).

- [ ] **Step 6: Arrancar dev server y comprobar visualmente**

```bash
yarn dev
```

1. Acceder como usuario con rol `eurocharger` → debe verse la tarjeta "Reservas cobradas hoy" encima de las 4 tarjetas existentes, y "Reservas" como nueva métrica seleccionable en el gráfico.
2. Acceder como usuario sin rol `eurocharger` → no debe verse la tarjeta extra ni la serie "Reservas" en el gráfico.

- [ ] **Step 7: Commit**

```bash
cd /Users/jonaygilabertlopez/Projects/eurocharger-manager
git add src/lib/axios.ts src/pages/dashboard/dashboard.tsx
git commit -m "feat: add reservations KPI card and chart series for eurocharger role"
```
