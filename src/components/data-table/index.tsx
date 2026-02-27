import type { GridColDef, GridValidRowModel, GridSortModel } from '@mui/x-data-grid';

import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import InputAdornment from '@mui/material/InputAdornment';

import { Form, Field } from 'src/components/hook-form';

import { Iconify } from '../iconify';



type DataTableProps<T extends GridValidRowModel> = {
    columns: GridColDef<T>[];
    fetchData: (page: number, pageSize: number, searchQuery: string, sortQuery: GridSortModel | undefined) => Promise<{ data: T[]; total: number }>;
    initialPage?: number;
    initialPageSize?: number;
    pageSizeOptions?: number[];
    className?: string;
};

export function DataTable<T extends { id: number | string }>({ 
    columns, 
    fetchData,
    initialPage = 0,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 40],
    className = 'flex flex-col'
}: DataTableProps<T>) {
    const [rows, setRows] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ 
        page: initialPage, pageSize: initialPageSize
    });

    const [queryOptions, setQueryOptions] = useState<{ sortModel?: GridSortModel }>({});

    const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
        // Here you save the data you need from the sort model
        console.dir(sortModel);
        setQueryOptions({ sortModel: [...sortModel] });
      }, []);

    const methods = useForm({});

    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchKeyPress = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.currentTarget.value);
    };


    useEffect(() => {
        
        const loadData = async () => {
            try {
                setLoading(true);
                const { page, pageSize } = paginationModel;
                const response = await fetchData(page, pageSize, searchQuery, queryOptions.sortModel);
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


    }, [fetchData, paginationModel, queryOptions, searchQuery]);



    return (
        <Box className={`${className} flex-row`}>
            <Box sx={{
                mb: 2,
            }}>
                <Form methods={methods}>
                    <Field.Text
                        name="search"
                        label=""
                        placeholder="Buscar..."
                        type='text'
                        value={searchQuery}
                        onChange={handleSearchKeyPress}
                        slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            <Iconify
                                                icon="eva:search-fill"
                                                width={20}
                                                height={20}/>
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                </Form>
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
                    console.log("Pagination meta changed:", meta)
                }
                }
                onPaginationModelChange={(model) => {
                    console.log("Pagination changed:", model)
                    setPaginationModel(model)
                }}
                sortingMode='server'
                onSortModelChange={handleSortModelChange}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: initialPageSize,
                            page: initialPage
                        },
                    },
                }}
                pageSizeOptions={pageSizeOptions}
                disableRowSelectionOnClick
                sx={{
                    "borderRadius": "10px",
                    [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
                      outline: 'none',
                    },
                    [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
                      {
                        outline: 'none',
                      },
                  }}
            />
        </Box>
    );
}