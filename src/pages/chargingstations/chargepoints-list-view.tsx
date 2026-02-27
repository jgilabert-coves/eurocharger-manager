import type { ReactNode } from "react";
import type { AxiosRequestConfig } from "axios";

import { Helmet } from "react-helmet-async";

import { Typography } from "@mui/material";
import { GridColDef, GridSortModel } from "@mui/x-data-grid";

import { useRouter } from "src/routes/hooks";

import { themeConfig } from "src/theme";
import { endpoints, fetcher } from "src/lib/axios";
import { DashboardContent } from "src/layouts/dashboard";

import { DataTable } from "src/components/data-table";

import { ChargepointsDatatableItem, ChargepointsDatatableResponse } from "src/types/charging_stations";

import { CONFIG } from '../../global-config';


const metadata = { title: `${CONFIG.appName}` };

function setChargepointStatusCell(status: string): ReactNode {
    const baseClasses = "p-2 border-4 rounded-lg"; // Base classes for padding, border, and rounded corners
    let colorStyle = { backgroundColor: themeConfig.palette.grey[200] }; // Default background color

    switch (status.toLowerCase()) {
        case 'available':
            colorStyle = { backgroundColor: themeConfig.palette.primary.lighter };
            break;
        case 'charging':
            colorStyle = { backgroundColor: themeConfig.palette.info.lighter };
            break;
        case 'unavailable':
            colorStyle = { backgroundColor: themeConfig.palette.error.lighter };
            break;
        case 'reserved':
            colorStyle = { backgroundColor: themeConfig.palette.warning.lighter };
            break;
        default:
            colorStyle = { backgroundColor: themeConfig.palette.grey[200] };
            break;
    }

    return <span className={baseClasses} style={colorStyle}>{status}</span>;
}



export default function ChargingStationsView() {

    const router = useRouter();

    const fetchChargingStations = async (page: number, pageSize: number, searchQuery: string, sortQuery: GridSortModel) => {
        try {
            const queryArgs: AxiosRequestConfig = {
                params: {
                    roaming: 0,
                    page,
                    pageSize,
                    searchQuery,
                    sortQuery: sortQuery.map(({ field, sort }) => `${field}=${sort}`).join('&'),
                }
            }
            const result: ChargepointsDatatableResponse = await fetcher([endpoints.chargepoints.list, queryArgs]);
            console.dir(result);
            return { data: result.data, total: result.total };

        } catch (err) {
            console.log("Error fetching chargepoint: ", err);
            return { data: [], total: 0 };
        }
    }

    const columns: GridColDef<ChargepointsDatatableItem>[] = [
        { field: 'code', headerName: 'ID', flex: 0, editable: false, minWidth: 100 },
        { field: 'name', headerName: 'Nombre', flex: 1, editable: false, minWidth: 150 },
        { field: 'status', headerName: 'Status', flex: 0, editable: false, align: "center", minWidth: 120, renderCell: (params) => (setChargepointStatusCell(params.value)) },
        // Add a column for each connector
        ...Array.from({ length: 2 }, (_, index) => ({
            field: `connector_${index}`,
            headerName: `Connector ${index + 1}`,
            flex: 0,
            editable: false,
            minWidth: 120,
            renderCell: (params: any) => {
                const connector = params.row.connectors[index];
                //console.log(params.row);
                return connector ? <span>{connector.connector_status}</span> : <span>N/A</span>;
            }
        })),
        { field: '', headerName: 'Acciones', flex: 0, editable: false, sortable: false, align: "center", minWidth: 120, renderCell: (params) => (
            <div>
                <a onClick={() => router.push(`/chargingstations/${params.row.id}`)}
                    className="text-blue-500 hover:underline cursor-pointer">
                    Ver
                </a>
            </div>
        ) }
    ];




    return (
        <>
            <Helmet>
                <title> {CONFIG.appName} </title>
            </Helmet>
            <DashboardContent>
                <Typography variant="h2" sx={{ mb: 5 }}>
                    Estaciones de carga
                </Typography>
                <DataTable
                    columns={columns}
                    fetchData={(page: number, pageSize: number, searchQuery: string, sortQuery?: GridSortModel) => fetchChargingStations(page, pageSize, searchQuery, sortQuery || [])}
                    initialPageSize={10}
                    pageSizeOptions={[10, 20, 40]}/>


            </DashboardContent>
        </>
    )
}