# Editar datos de usuario de la app permitiendo campos en blanco (NULL)

**Fecha:** 2026-06-26
**Repos afectados:** `eurocharger-manager` (frontend), `eurocharger-api` (backend REST)

## Objetivo

Permitir, desde la sección "Datos personales" del detalle de usuario en eurocharger-manager,
editar los datos de un usuario de la app (`app_users`) y **dejar en blanco los campos que se
pueda**, persistiéndolos como `NULL` (no como cadena vacía ni ignorándolos).

Hoy no es posible: la validación del backend exige casi todos los campos, y el frontend envía
`undefined` al vaciar (que tampoco persistiría `NULL`).

## Contexto clave: identidad de facturación vs identidad de login

`app_users` tiene dos "identidades":

- **Login / registro:** `name`, `surname`, `email` (email es `UNIQUE`). La fija la app móvil al
  registrarse. **El gestor NO debe editarla.**
- **Facturación:** `billing_name`, `billing_surname`, `billing_email`. Es lo que el gestor
  edita y lo que se usa para facturar.

La sección "Datos personales" del gestor opera sobre la **identidad de facturación**: el
`UPDATE` actual ya guarda el campo "Nombre" en `billing_name`, "Apellidos" en `billing_surname`
y "Email" en `billing_email` (comportamiento intencional, confirmado). El desajuste actual es
que el formulario **lee** de las columnas reales (`name`/`surname`/`email`) pero **escribe** en
las `billing_*`; se corrige leyendo también de `billing_*`.

### Campos que GATEAN la carga (api-graphql `authorization_service.py:228-237`)

Un usuario **no puede cargar** si cualquiera de estos 8 campos es `NULL`:

`address`, `postal_code`, `city`, `country_id`, `birthday`, `telephone`, `card_id`,
**`billing_email`**

(Nótese: gatea `billing_email`, no `email`. Por eso "Email" del form = `billing_email`.)
`billing_name`/`billing_surname` y `state_province_id` NO gatean la carga.

## Decisiones (acordadas)

1. Campos vaciables → todos los editables del formulario (todos son nullable en BD).
2. Form "Nombre/Apellidos/Email" lee **y** escribe `billingName/billingSurname/billingEmail`
   (el GET ya los devuelve). El `name`/`email` de login no se tocan.
3. `city` se guarda en `app_users.city` (hoy falta en el `UPDATE` — se añade).
4. Se permite vaciar cualquier campo, **incluidos los que gatean la carga**, pero el formulario
   muestra un **aviso no bloqueante** cuando algún campo que gatea la carga queda vacío.

## Diseño

Enfoque: **PUT de objeto completo con `null` explícito**. Se mantiene el contrato de payload
actual (claves `name`, `surname`, `email`, `cardId`, `telephone`, `address`, `city`,
`postalCode`, `stateProvinceId`, `countryId`, `birthday`, `isActive`); el backend ya mapea
`name→billing_name`, `surname→billing_surname`, `email→billing_email`. Solo cambia: se permite
`null`, se persiste `null`, y se añade `city`. Descartado PATCH parcial real por YAGNI.

### Capa 1 — Validación backend

Archivo: `eurocharger-api/src/services/appusers/update-data.service.ts`

Relajar `updateAppUserDataSchema` para que todos los campos editables admitan `null`/ausencia,
manteniendo los patrones cuando hay valor. Único campo realmente obligatorio: `isActive`.

| Campo (clave payload) | Antes | Después |
|---|---|---|
| `name` (→billing_name) | `string().min(1)` | `string().nullable().optional()` |
| `surname` (→billing_surname) | `string().nullable().optional()` | sin cambios |
| `email` (→billing_email) | `string().pattern(EMAIL_REGEX)` | `string().pattern(EMAIL_REGEX).nullable().optional()` |
| `cardId` | `string().pattern(DNI_CIF_REGEX)` | `string().pattern(DNI_CIF_REGEX).nullable().optional()` |
| `telephone` | `string()` | `string().nullable().optional()` |
| `address` | `string()` | `string().nullable().optional()` |
| `postalCode` | `string()` | `string().nullable().optional()` |
| `city` | `string()` | `string().nullable().optional()` |
| `stateProvinceId` | `number()` | `number().nullable().optional()` |
| `countryId` | `number()` | `number().nullable().optional()` |
| `birthday` | `date()` | `date().nullable().optional()` |
| `isActive` | `boolean()` | sin cambios (obligatorio) |

`formatValidationError` y `FIELD_REQUIRED_MESSAGES` se conservan (seguirán cubriendo `isActive`
y los errores de patrón de `email`/`cardId`); el resto de mensajes "obligatorio" quedarán
inactivos, lo cual es correcto.

Nota de implementación: verificar que `myzod.date()` sigue aceptando el string `YYYY-MM-DD` que
envía el frontend tal como hoy (comportamiento preexistente; no se cambia el formato).

### Capa 2 — Repository backend

Archivo: `eurocharger-api/src/repositories/appusers.repository.ts` (`updateProfileData`)

Añadir `city = ?` y convertir `undefined` → `null` (mysql2 no acepta `undefined`). Se mantiene
el mapeo a `billing_*` para name/surname/email. **No** se tocan las columnas reales
`name`/`surname`/`email`.

```sql
UPDATE app_users SET
  billing_name = ?, billing_surname = ?, billing_email = ?,
  card_id = ?, telephone = ?, address = ?, postal_code = ?,
  city = ?, state_province_id = ?, country_id = ?, birthday = ?,
  is_active = ?
WHERE id = ?
```

Parámetros, en orden, con `?? null` en los opcionales:
`data.name ?? null`, `data.surname ?? null`, `data.email ?? null`, `data.cardId ?? null`,
`data.telephone ?? null`, `data.address ?? null`, `data.postalCode ?? null`,
`data.city ?? null`, `data.stateProvinceId ?? null`, `data.countryId ?? null`,
`data.birthday ?? null`, `data.isActive`, `appUserId`.

### Capa 3 — Frontend

Archivo: `eurocharger-manager/src/pages/appusers/appuser-detail-view.tsx` (`PersonalDataSection`)

1. **Precarga (`syncFromUser`, líneas 153-166):** vincular los campos de identidad a la
   facturación:
   - `setName(u.billingName ?? '')`
   - `setSurname(u.billingSurname ?? '')`
   - `setEmail(u.billingEmail ?? '')`
   - resto de campos sin cambios.
   (Recomendado: renombrar las variables de estado a `billingName`/`billingSurname`/
   `billingEmail` para legibilidad; se siguen enviando bajo las claves `name`/`surname`/`email`
   del payload, con un comentario que lo aclare.)

2. **Vista de lectura (InfoRows, líneas 223-225):** mostrar `user.billingName`,
   `user.billingSurname`, `user.billingEmail` en vez de `user.name/surname/email`, para que
   lectura y edición coincidan.

3. **`handleSave` (líneas 178-204):** enviar `null` en vez de `undefined` al vaciar. Helper
   `emptyToNull(v: string) => v.trim() === '' ? null : v.trim()`:
   - `name: emptyToNull(name)`, `surname: emptyToNull(surname)`, `email: emptyToNull(email)`,
     `telephone`, `cardId`, `address`, `city`, `postalCode`, `birthday`: idem.
   - `stateProvinceId: stateProvinceId ?? null`, `countryId: countryId ?? null`.
   - `isActive`: sin cambios.
   - Ningún campo se marca `required` en la UI (todos pueden quedar vacíos).

4. **Aviso de carga (nuevo):** en modo edición, mostrar un `Alert` no bloqueante (severity
   `warning`) cuando alguno de los campos que gatean la carga esté vacío:
   `billingEmail`, `telephone`, `cardId`, `address`, `city`, `postalCode`, `countryId`,
   `birthday`. Texto sugerido: "Con alguno de estos campos vacío, este usuario no podrá iniciar
   cargas." El aviso no impide guardar.

### Fuera de alcance

- Listado de usuarios (`appusers-view.tsx`): sigue mostrando `name`/`email` reales. No se toca.
- Endpoint/sección de facturación (`/appusers/:id/billing`, `billing_details`). No se toca.

## Manejo de errores

- Backend: si `isActive` falta, o `email`/`cardId` traen valor con formato inválido →
  response estándar `{ status_code: 500, error: <mensaje> }` (formato actual del controller).
  El frontend ya muestra `apiError.error` en `saveError`.
- Frontend: el aviso de carga es informativo; no bloquea el guardado.

## Testing

- `eurocharger-manager`: no existe suite de tests (CLAUDE.md). Verificación manual:
  1. Editar usuario, vaciar cada campo opcional, guardar → queda `NULL` en su columna
     correspondiente (`billing_*` para nombre/apellidos/email; columna real para el resto,
     incluida `city`).
  2. Comprobar que `city` ahora sí se persiste.
  3. Comprobar que aparece el aviso al vaciar un campo que gatea la carga.
  4. Comprobar que `name`/`email` de login en `app_users` no cambian.
- `eurocharger-api`: si existe suite, añadir test del service (acepta nulls) y del repository
  (mapeo + `city` + `?? null`); si no, verificación manual con `PUT /appusers/:id`.

## Criterios de aceptación

1. Vaciar cualquiera de los campos editables y guardar → el campo queda `NULL` en su columna.
2. El campo "Email" del form lee y escribe `billing_email`; el `email` de login no se modifica.
3. `city` se persiste en `app_users.city`.
4. Al dejar vacío un campo que gatea la carga, el form muestra el aviso (sin bloquear guardado).
5. `cardId` con formato inválido → error; `cardId`/`email` vacíos → se aceptan y quedan `NULL`.
