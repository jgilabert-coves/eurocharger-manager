import type { Dayjs } from 'dayjs';
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type DateRangePreset = {
  label: string;
  build: () => { from: Dayjs; to: Dayjs };
};

/** Presets relativos por defecto (estilo consola de Google). */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: 'Hoy', build: () => ({ from: dayjs().startOf('day'), to: dayjs().endOf('day') }) },
  {
    label: 'Ayer',
    build: () => ({
      from: dayjs().subtract(1, 'day').startOf('day'),
      to: dayjs().subtract(1, 'day').endOf('day'),
    }),
  },
  { label: 'Última hora', build: () => ({ from: dayjs().subtract(1, 'hour'), to: dayjs() }) },
  { label: 'Últimas 3 horas', build: () => ({ from: dayjs().subtract(3, 'hour'), to: dayjs() }) },
  { label: 'Últimas 6 horas', build: () => ({ from: dayjs().subtract(6, 'hour'), to: dayjs() }) },
  { label: 'Últimas 12 horas', build: () => ({ from: dayjs().subtract(12, 'hour'), to: dayjs() }) },
  { label: 'Últimas 24 horas', build: () => ({ from: dayjs().subtract(24, 'hour'), to: dayjs() }) },
  { label: 'Últimos 7 días', build: () => ({ from: dayjs().subtract(7, 'day'), to: dayjs() }) },
  { label: 'Últimos 30 días', build: () => ({ from: dayjs().subtract(30, 'day'), to: dayjs() }) },
];

// ----------------------------------------------------------------------

export type DateRangeFilterProps = {
  /** Inicio del rango aplicado (null = sin filtro). */
  from: Dayjs | null;
  /** Fin del rango aplicado (null = sin filtro). */
  to: Dayjs | null;
  /** Se invoca al aplicar/limpiar el rango. El consumidor decide qué hacer (formato, UTC, etc.). */
  onChange: (from: Dayjs | null, to: Dayjs | null) => void;
  /** Presets relativos. Por defecto: DEFAULT_DATE_RANGE_PRESETS. Pasa [] para ocultarlos. */
  presets?: DateRangePreset[];
  /** Texto del botón cuando no hay rango. Por defecto: "Rango de fechas". */
  placeholder?: string;
  /** Granularidad de los selectores. "datetime" (fecha+hora) por defecto, o "date" (solo fecha). */
  granularity?: 'datetime' | 'date';
  /** Formato de visualización. Por defecto según granularidad. */
  format?: string;
  /** Estilos extra para el botón disparador. */
  sx?: SxProps<Theme>;
};

export function DateRangeFilter({
  from,
  to,
  onChange,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  placeholder = 'Rango de fechas',
  granularity = 'datetime',
  format,
  sx,
}: DateRangeFilterProps) {
  const fmt = format ?? (granularity === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm');

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [bufFrom, setBufFrom] = useState<Dayjs | null>(from);
  const [bufTo, setBufTo] = useState<Dayjs | null>(to);

  const open = (e: React.MouseEvent<HTMLElement>) => {
    setBufFrom(from);
    setBufTo(to);
    setAnchorEl(e.currentTarget);
  };
  const close = () => setAnchorEl(null);

  const hasInvalidValue = (!!bufFrom && !bufFrom.isValid()) || (!!bufTo && !bufTo.isValid());
  const crossed = !!bufFrom && !!bufTo && bufFrom.isAfter(bufTo);
  const canApply = !hasInvalidValue && !crossed && (!!bufFrom || !!bufTo);

  const applyPreset = (preset: DateRangePreset) => {
    const { from: f, to: t } = preset.build();
    onChange(f, t);
    close();
  };

  const applyCustom = () => {
    if (!canApply) return;
    onChange(bufFrom, bufTo);
    close();
  };

  const clear = () => {
    onChange(null, null);
    close();
  };

  const active = !!from || !!to;
  const label =
    !from && !to ? placeholder : `${from ? from.format(fmt) : '…'} – ${to ? to.format(fmt) : '…'}`;

  const panelTitle = granularity === 'date' ? 'Fecha de inicio y fin' : 'Hora de inicio y fin';

  const renderPicker = (
    pickerLabel: string,
    value: Dayjs | null,
    onPick: (v: Dayjs | null) => void,
    opts: { min?: Dayjs; max?: Dayjs }
  ) =>
    granularity === 'date' ? (
      <DatePicker
        label={pickerLabel}
        value={value}
        onChange={onPick}
        format={fmt}
        minDate={opts.min}
        maxDate={opts.max}
        slotProps={{ textField: { size: 'small', fullWidth: true } }}
      />
    ) : (
      <DateTimePicker
        label={pickerLabel}
        value={value}
        onChange={onPick}
        format={fmt}
        minDateTime={opts.min}
        maxDateTime={opts.max}
        slotProps={{ textField: { size: 'small', fullWidth: true } }}
      />
    );

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        onClick={open}
        startIcon={<Iconify icon="mingcute:time-line" width={16} />}
        endIcon={<Iconify icon="eva:chevron-down-fill" width={16} />}
        sx={[
          { height: 40, fontWeight: 400, whiteSpace: 'nowrap' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {label}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: 2, overflow: 'hidden' } } }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }}>
          {/* Presets relativos */}
          {presets.length > 0 && (
            <>
              <List dense disablePadding sx={{ minWidth: 220, py: 1 }}>
                {presets.map((p) => (
                  <ListItemButton key={p.label} onClick={() => applyPreset(p)} sx={{ px: 2.5 }}>
                    <Typography variant="body2">{p.label}</Typography>
                  </ListItemButton>
                ))}
              </List>
              <Divider orientation="vertical" flexItem />
            </>
          )}

          {/* Rango personalizado */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <Box sx={{ p: 2.5, minWidth: 300 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                {panelTitle}
              </Typography>

              <Stack spacing={2}>
                {renderPicker('Desde', bufFrom, setBufFrom, { max: bufTo ?? undefined })}
                {renderPicker('Hasta', bufTo, setBufTo, { min: bufFrom ?? undefined })}
              </Stack>

              {(crossed || hasInvalidValue) && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {crossed
                    ? 'La fecha "Desde" no puede ser posterior a "Hasta".'
                    : 'Introduce una fecha válida.'}
                </Typography>
              )}

              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
                {active && (
                  <Button color="inherit" size="small" onClick={clear}>
                    Limpiar
                  </Button>
                )}
                <Button color="inherit" size="small" onClick={close}>
                  Cancelar
                </Button>
                <Button variant="contained" size="small" disabled={!canApply} onClick={applyCustom}>
                  Aplicar
                </Button>
              </Stack>
            </Box>
          </LocalizationProvider>
        </Stack>
      </Popover>
    </>
  );
}
