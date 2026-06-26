# Editar datos de usuario de la app permitiendo campos en blanco (NULL)

**Fecha:** 2026-06-26
**Repos afectados:** `eurocharger-manager` (frontend), `eurocharger-api` (backend REST)

## Objetivo

Permitir, desde la sección "Datos personales" del detalle de usuario en eurocharger-manager,
editar los datos de un usuario de la app (`app_users`) y **dejar en blanco los campos que la
base de datos admite como `NULL`**, persistiéndolos como `NULL` (no como cadena vacía ni
ignorándolos).

Hoy esto no es posible: la validación del backend exige casi todos los campos, y el frontend
envía `undefined` al vaciar (lo que tampoco persistiría un `NULL` aunque la validación lo
permitiese).

## Alcance de campos

Campos de `app_users` que **podrán quedar en blanco → `NULL`** (son `NULL` en BD):

- `surname`, `telephone`, `birthday`, `card_id`, `address`, `postal_code`, `city`,
  `state_province_id`, `country_id`

Campos que **siguen siendo obligatorios** (son `NOT NULL` en BD):

- `name`, `email`, `is_active`

Fuera de alcance: `billing_email`, `billing_name`, `billing_surname` (no se editan en la UI
de datos personales; se gestionan por el endpoint de facturación).

## Bug detectado (se corrige como parte de este trabajo)

`AppUsersRepository.updateProfileData` (`eurocharger-api/src/repositories/appusers.repository.ts:333-365`)
tiene las columnas del `UPDATE` desalineadas respecto a los valores:

```sql
UPDATE app_users SET
  billing_name = ?,      -- recibe data.name   ← el nombre se guarda en billing_name
  billing_surname = ?,   -- recibe data.surname
  billing_email = ?,     -- recibe data.email  ← el email se guarda en billing_email
  card_id = ?, telephone = ?, address = ?, postal_code = ?,
  state_province_id = ?, country_id = ?, birthday = ?, is_active = ?
WHERE id = ?
```

Consecuencias actuales:
- `name`, `surname` y `email` reales **nunca se actualizan** (van a las columnas `billing_*`).
- `city` **no se actualiza nunca** (no aparece en la query, pese a que el schema lo exige y el
  frontend lo envía).

Se corrige reescribiendo la query con el mapeo correcto.

## Diseño

Enfoque elegido: **PUT de objeto completo con `null` explícito**. Se mantiene el patrón actual
(el frontend envía el objeto completo); se permite `null` en los campos nullable y se persiste.
Descartado un PATCH parcial real (distinguir "campo ausente" vs "campo a null") por YAGNI.

### Capa 1 — Validación backend

Archivo: `eurocharger-api/src/services/appusers/update-data.service.ts`

Relajar `updateAppUserDataSchema`:

| Campo | Antes | Después |
|---|---|---|
| `name` | `string().min(1)` | sin cambios (obligatorio) |
| `email` | `string().pattern(EMAIL_REGEX)` | sin cambios (obligatorio) |
| `isActive` | `boolean()` | sin cambios (obligatorio) |
| `surname` | `string().nullable().optional()` | sin cambios |
| `cardId` | `string().pattern(DNI_CIF_REGEX)` | `string().pattern(DNI_CIF_REGEX).nullable().optional()` (valida patrón solo si hay valor) |
| `telephone` | `string()` | `string().nullable().optional()` |
| `address` | `string()` | `string().nullable().optional()` |
| `postalCode` | `string()` | `string().nullable().optional()` |
| `city` | `string()` | `string().nullable().optional()` |
| `stateProvinceId` | `number()` | `number().nullable().optional()` |
| `countryId` | `number()` | `number().nullable().optional()` |
| `birthday` | `date()` | `date().nullable().optional()` |

`FIELD_REQUIRED_MESSAGES` y `formatValidationError` se mantienen; seguirán cubriendo los
campos que siguen obligatorios (`name`, `email`, `isActive`) y los errores de patrón.

### Capa 2 — Repository backend

Archivo: `eurocharger-api/src/repositories/appusers.repository.ts` (`updateProfileData`)

Reescribir la query con el mapeo correcto y añadir `city`. Convertir `undefined` → `null`
para MySQL (mysql2 no acepta `undefined` como parámetro):

```sql
UPDATE app_users SET
  name = ?, surname = ?, email = ?, card_id = ?, telephone = ?,
  address = ?, postal_code = ?, city = ?, state_province_id = ?,
  country_id = ?, birthday = ?, is_active = ?
WHERE id = ?
```

Parámetros, en orden, usando `?? null` para los opcionales:
`data.name`, `data.surname ?? null`, `data.email`, `data.cardId ?? null`,
`data.telephone ?? null`, `data.address ?? null`, `data.postalCode ?? null`,
`data.city ?? null`, `data.stateProvinceId ?? null`, `data.countryId ?? null`,
`data.birthday ?? null`, `data.isActive`, `appUserId`.

No se tocan las columnas `billing_*` aquí.

### Capa 3 — Frontend

Archivo: `eurocharger-manager/src/pages/appusers/appuser-detail-view.tsx`
(`PersonalDataSection.handleSave`, líneas 178-204)

Cambiar el payload para enviar `null` (no `undefined`) en los campos opcionales al vaciarlos:

- `name`, `email`: se mantienen obligatorios. Validar en el form que no estén vacíos antes de
  enviar (mostrar error inline si lo están), evitando un 400 del backend.
- `surname`, `telephone`, `cardId`, `address`, `city`, `postalCode`, `birthday`:
  `valor.trim() || null`.
- `stateProvinceId`, `countryId`: `valor ?? null` (ya son `number | null`).
- `isActive`: sin cambios.

Helper de mapeo sugerido: una función `emptyToNull(v: string) => v.trim() === '' ? null : v.trim()`.

Los campos opcionales no deben marcarse `required` en la UI; `name` y `email` sí.

## Manejo de errores

- Backend: si `name`/`email`/`isActive` faltan o `cardId` no cumple el patrón → response
  estándar `{ status_code: 400, error: <mensaje> }`. El frontend ya muestra `apiError.error`
  en `saveError`.
- Frontend: validación previa de `name` y `email` no vacíos antes del PUT.

## Testing

- `eurocharger-manager`: no existe suite de tests (confirmado en CLAUDE.md). Verificación
  manual: editar un usuario, vaciar cada campo opcional, guardar y comprobar `NULL` en BD;
  comprobar que `name`/`email`/`city` ahora sí se actualizan correctamente.
- `eurocharger-api`: si existe suite, añadir tests del service (validación con nulls) y del
  mapeo del repository; si no, verificación manual con una llamada `PUT /appusers/:id`.

## Criterios de aceptación

1. Vaciar cualquiera de los campos nullable y guardar → el campo queda `NULL` en `app_users`.
2. Editar `name`, `surname`, `email`, `city` → se actualizan en sus columnas reales (bug
   corregido); ya no se escriben en `billing_*`.
3. `name` o `email` vacíos → el guardado se bloquea con mensaje claro.
4. `cardId` con valor inválido → error de patrón; `cardId` vacío → se acepta y queda `NULL`.
