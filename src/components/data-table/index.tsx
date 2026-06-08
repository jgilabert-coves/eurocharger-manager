import type { GridColDef, GridSortModel, GridRowParams, GridValidRowModel } from '@mui/x-data-grid';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import InputAdornment from '@mui/material/InputAdornment';

import { useDebounce } from 'src/hooks/use-debounce';

import { Iconify } from '../iconify';

type DataTableProps<T extends GridValidRowModel> = {
  columns: GridColDef<T>[];
  fetchData: (
    page: number,
    pageSize: number,
    searchQuery: string,
    sortQuery: GridSortModel | undefined
  ) => Promise<{ data: T[]; total: number }>;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  onRowClick?: (params: GridRowParams<T>) => void;
};

export function DataTable<T extends { id: number | string }>({
  columns,
  fetchData,
  initialPage = 0,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 40],
  className = 'flex flex-col',
  onRowClick,
}: DataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: initialPage,
    pageSize: initialPageSize,
  });

  const [queryOptions, setQueryOptions] = useState<{ sortModel?: GridSortModel }>({});

  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    // Here you save the data you need from the sort model
    console.dir(sortModel);
    setQueryOptions({ sortModel: [...sortModel] });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, [debouncedSearch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { page, pageSize } = paginationModel;
        const response = await fetchData(page, pageSize, debouncedSearch, queryOptions.sortModel);
        setRows(response.data);
        setTotalRows(response.total);
      } catch (err) {
        console.error('Error fetching data:', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchData, paginationModel, queryOptions, debouncedSearch]);

  return (
    <Box className={`${className} flex-row`}>
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Buscar..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ maxWidth: 400 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        paginationMode="server"
        rowCount={-1}
        paginationModel={paginationModel}
        disableColumnFilter
        disableColumnMenu
        onPaginationMetaChange={(meta) => {
          console.log('Pagination meta changed:', meta);
        }}
        onPaginationModelChange={(model) => {
          console.log('Pagination changed:', model);
          setPaginationModel(model);
        }}
        sortingMode="server"
        onSortModelChange={handleSortModelChange}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: initialPageSize,
              page: initialPage,
            },
          },
        }}
        pageSizeOptions={pageSizeOptions}
        disableRowSelectionOnClick
        onRowClick={onRowClick}
        sx={{
          ...(onRowClick && { cursor: 'pointer' }),
          borderRadius: '10px',
          [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
            outline: 'none',
          },
          [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]: {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
}
