import type { RouteObject} from "react-router";

import {Outlet} from "react-router";
import {lazy, Suspense} from "react";

import {usePathname} from "../hooks";
import {CONFIG} from "../../global-config";
import {AuthGuard} from "../../auth/guard";
import {DashboardLayout} from "../../layouts/dashboard";
import {LoadingScreen} from "../../components/loading-screen";

const ActivesPage = lazy(() => import('src/pages/transactions/transactions-view'));
const CompletedPage = lazy(() => import('src/pages/transactions/finished-view'));

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

const activesLayout = () => (
    <ActivesPage/>
);

const finishedLayout = () => (
    <CompletedPage/>
);


export const transactionsRoutes: RouteObject[] = [
    {
        path: 'transactions',
        element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
        children: [
            { path: '', element: CONFIG.auth.skip ? activesLayout() : <AuthGuard>{activesLayout()}</AuthGuard> },
            { path: 'completed', element: CONFIG.auth.skip ? activesLayout() : <AuthGuard>{finishedLayout()}</AuthGuard> },
        ]
    }
]