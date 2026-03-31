import type { RouteObject} from "react-router";

import {Outlet} from "react-router";
import {lazy, Suspense} from "react";

import {usePathname} from "../hooks";
import {CONFIG} from "../../global-config";
import {AuthGuard} from "../../auth/guard";
import {DashboardLayout} from "../../layouts/dashboard";
import {LoadingScreen} from "../../components/loading-screen";

const AlarmsView = lazy(() => import('src/pages/alarms/alarms-view'));

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

const alarmsLayout = () => (
    <AlarmsView/>
);

export const  alarmsRoutes: RouteObject[] = [
    {
        path: 'alarms',
        element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
        children: [
            { path: '', element: CONFIG.auth.skip ? alarmsLayout() : <AuthGuard>{alarmsLayout()}</AuthGuard> },
            { path: ':id', element: CONFIG.auth.skip ? alarmsLayout() : <AuthGuard>{alarmsLayout()}</AuthGuard> },
        ]
    },
    {
        path: 'alarm', 
        element: CONFIG.auth.skip ? alarmsLayout() : <AuthGuard>{alarmsLayout()}</AuthGuard>
    }
]