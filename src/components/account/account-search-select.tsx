import type { Client } from 'src/types/clients';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useDebounce } from 'src/hooks/use-debounce';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type AccountOption = Pick<Client, 'id' | 'business_name'>;

export type AccountSearchSelectProps = {
  value: AccountOption | null;
  onChange: (account: AccountOption | null) => void;
  label?: string;
  helperText?: string;
  extraOptions?: AccountOption[];
  size?: 'small' | 'medium';
  disabled?: boolean;
};

export function AccountSearchSelect({
  value,
  onChange,
  label = 'Cuenta',
  helperText,
  extraOptions = [],
  size,
  disabled,
}: AccountSearchSelectProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery<{ data: AccountOption[] }>({
    queryKey: ['accounts', 'search', debouncedSearch],
    queryFn: () =>
      fetcher([
        endpoints.accounts.list,
        { params: { searchQuery: debouncedSearch, pageSize: 10 } },
      ]),
    staleTime: 30 * 1000,
  });

  const fetched = data?.data ?? [];
  const options = [
    ...extraOptions,
    ...fetched.filter((a) => !extraOptions.some((e) => e.id === a.id)),
  ];

  return (
    <Autocomplete
      fullWidth
      size={size}
      disabled={disabled}
      noOptionsText="No hay resultados"
      options={options}
      value={value}
      onChange={(_, v) => onChange(v)}
      inputValue={search}
      onInputChange={(_, v) => setSearch(v)}
      loading={isLoading}
      getOptionLabel={(o) => o.business_name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar cuenta..."
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
