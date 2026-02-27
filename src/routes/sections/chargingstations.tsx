import type { RouteObject} from "react-router";

import {Outlet} from "react-router";
import {lazy, Suspense} from "react";

import {usePathname} from "../hooks";
import {CONFIG} from "../../global-config";
import {AuthGuard} from "../../auth/guard";
import {DashboardLayout} from "../../layouts/dashboard";
import {LoadingScreen} from "../../components/loading-screen";

const ChargingStationsPage = lazy(() => import('src/pages/chargingstations/chargepoints-list-view'));
const ChargingStationView = lazy(() => import('src/pages/chargingstations/charging-station-view'));

function SuspenseOutlet() {
    const pathname = usePathname();
    return (
        <Suspense key={pathname} fallback={<LoadingScreen />}>
            <Outlet />
        </Suspense>
    );
}

const dashboardLayout = () => (
    <DashboardLayout>
        <SuspenseOutlet />
    </DashboardLayout>
);

const chargingStationsLayout = () => (
    <ChargingStationsPage/>
);

const chargingStationView = () => (
    <ChargingStationView/>
);

export const  chargingStationsRoutes: RouteObject[] = [
    {
        path: 'chargingstations',
        element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
        children: [
            { path: '', element: CONFIG.auth.skip ? chargingStationsLayout() : <AuthGuard>{chargingStationsLayout()}</AuthGuard> },
            { path: ':id', element: CONFIG.auth.skip ? chargingStationsLayout() : <AuthGuard>{chargingStationView()}</AuthGuard> },
        ]
    },
    {
        path: 'chargingstation', 
        element: CONFIG.auth.skip ? chargingStationView() : <AuthGuard>{chargingStationView()}</AuthGuard>
    }
]