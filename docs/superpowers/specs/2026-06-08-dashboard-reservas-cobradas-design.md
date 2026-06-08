# Dashboard — Reservas cobradas (rol eurocharger)

**Fecha:** 2026-06-08  
**Proyectos afectados:** `eurocharger-api`, `eurocharger-manager`

---

## Contexto

El dashboard principal muestra 4 tarjetas KPI y un gráfico de estadísticas con 5 métricas. Los usuarios con rol `eurocharger` necesitan ver también el número de reservas cobradas: una tarjeta con el total del día y una nueva línea en el gráfico de estadísticas existente.

Una reserva está "cobrada" cuando existe un `Receipt` con `type_id = 2` (tipo reserva) y `reservation_id` apuntando a esa reserva.

---

## Requisitos

- La tarjeta y la serie del gráfico son **exclusivas del rol `eurocharger`**.
- La tarjeta muestra reservas cobradas **del día actual**.
- La serie del gráfico sigue el mismo rango de fechas (semana / mes / año / periodo personalizado) que el resto de métricas.
- No se modifica nada para usuarios sin el rol `eurocharger`.

---

## Diseño

### Tarjeta KPI

- **Título:** "Reservas cobradas hoy"  
- **Valor:** número entero (count del día)
- **Icono:** `solar:calendar-date-bold`  
- **Palette:** `info`
- Se renderiza en una fila propia **encima** del grid de 4 tarjetas existentes (sin tocar el grid actual).

### Serie en el gráfico

- **Label:** "Reservas"  
- **Color:** `#0EA5E9`  
- El backend añade la serie condicionalmente cuando el JWT del request pertenece a un usuario `eurocharger`. El frontend no necesita cambios: `StatsChart` renderiza todos los `series` que llega del endpoint.

---

## Backend (`eurocharger-api`)

### `src/types/dashboard.types.ts`
Añadir `'reservations'` a `StatsMetric`:
```typescript
export type StatsMetric = 'charges' | 'energy' | 'revenue' | 'users' | 'avg-charge-time' | 'reservations';
```

### `src/repositories/dashboard.repository.ts`
Dos métodos nuevos:

**`getReservationsPaidToday(accountId, guestUserId)`**
```sql
SELECT COUNT(DISTINCT r.id) AS total
FROM reservations r
JOIN receipts rec ON rec.reservation_id = r.id AND rec.type_id = 2
JOIN connectors conn ON conn.id = r.connector_id
JOIN chargepoints c ON c.id = conn.chargepoint_id
WHERE DATE(rec.created_at) = CURDATE()
  AND c.deleted_at IS NULL
  [AND c.account_id = ?]
```

**`getReservationsPaidGrouped(where, groupExpr, params)`**
```sql
SELECT <groupExpr> AS idx, COUNT(DISTINCT r.id) AS value
FROM reservations r
JOIN receipts rec ON rec.reservation_id = r.id AND rec.type_id = 2
JOIN connectors conn ON conn.id = r.connector_id
JOIN chargepoints c ON c.id = conn.chargepoint_id
WHERE <where>
GROUP BY idx
```

### `src/services/dashboard.service.ts`

1. Añadir entrada en `METRIC_INFO`:
   ```typescript
   reservations: { label: "Reservas", color: "#0EA5E9" },
   ```

2. `_getStatsChartInner` acepta nuevo parámetro `isEurocharger: boolean`.  
   Cuando `isEurocharger = true`:
   - Ejecuta `getReservationsPaidGrouped` en el `Promise.all` junto a las otras queries.
   - Construye `reservationsDP` y añade la serie al array `series`.
   - El filtro de cliente sigue el mismo patrón que las demás métricas (join connector → chargepoint).

3. Nuevo método público:
   ```typescript
   static async getReservationsPaidToday(accountId, guestUserId): Promise<number>
   ```
   Delega en `DashboardRepository.getReservationsPaidToday` con caché corta (TTL 1 min).

### `src/controllers/dashboard.controller.ts`

- `getStatsChart`: detecta `isEurocharger = req.roles?.includes('eurocharger') ?? false` y lo pasa al service.
- Nuevo método `getReservationsPaidToday`: llama al service y responde `{ status_code: 200, data: { total }, error: null }`.

### `src/routes/dashboard.routes.ts`

```typescript
router.get(
  '/reservations/today',
  authenticateJWT,
  requireRole('eurocharger'),
  DashboardController.getReservationsPaidToday,
);
```

---

## Frontend (`eurocharger-manager`)

### `src/lib/axios.ts`
```typescript
dashboard: {
  ...
  reservationsToday: '/dashboard/reservations/today',
}
```

### `src/pages/dashboard/dashboard.tsx`

1. Importar `useAuthContext`.
2. Derivar `const isEurocharger = user?.roles?.includes('eurocharger') ?? false`.
3. Añadir query condicional:
   ```typescript
   const { data: reservationsRes } = useQuery({
     queryKey: ['dashboard', 'reservationsToday'],
     queryFn: () => fetcher(endpoints.dashboard.reservationsToday),
     enabled: isEurocharger,
   });
   ```
4. Renderizar el KPI card **encima** del grid de 4 tarjetas, condicionalmente:
   ```tsx
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

---

## Verificación

1. Con un usuario `eurocharger`:
   - `GET /api/dashboard/reservations/today` devuelve `{ data: { total: N } }`.
   - `GET /api/dashboard/stats?from=...&to=...` incluye la serie "Reservas" en `series[]`.
   - El dashboard muestra la tarjeta KPI encima de las 4 existentes.
   - El gráfico muestra "Reservas" como métrica seleccionable.

2. Con un usuario sin rol `eurocharger`:
   - `GET /api/dashboard/reservations/today` devuelve 403.
   - `GET /api/dashboard/stats` NO incluye la serie "Reservas".
   - El dashboard no muestra la tarjeta KPI adicional.
