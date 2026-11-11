import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { routeConfig } from './routeConfig';
import { publicRouteConfig } from './publicRouteConfig';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { MemberPageBoundary } from '@/features/member/components/MemberPageBoundary';
import { Loader } from '@/components/common/Loader';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import AccessStatusPage from '@/pages/AccessStatusPage';
import { RouteErrorBoundary } from '@/components/ui/RouteErrorBoundary';
import { routeAliases } from './routeAliases';
export function AppRoutes(){return <RouteErrorBoundary><Suspense fallback={<Loader label="Loading…"/>}><Routes>{publicRouteConfig.map(({path,component:Page})=><Route key={path} path={path} element={<AuthLayout><Page/></AuthLayout>}/>) }{routeConfig.map(({id,path,workspace,component:Page})=>workspace==='Workspace'?<Route key={id} path={path} element={<ProtectedRoute allowWorkspaceHub><MainLayout workspace="Member"><MemberPageBoundary><Page/></MemberPageBoundary></MainLayout></ProtectedRoute>}/>:<Route key={id} path={path} element={<ProtectedRoute><MainLayout workspace={workspace}>{workspace==='Member'?<MemberPageBoundary><Page/></MemberPageBoundary>:<Page/>}</MainLayout></ProtectedRoute>}/>) }{routeAliases.map(a=><Route key={`alias:${a.from}`} path={a.from} element={<Navigate to={a.to} replace/>}/>)}<Route path="/access-status" element={<AuthLayout><AccessStatusPage/></AuthLayout>}/><Route path="/unauthorized" element={<AuthLayout><UnauthorizedPage/></AuthLayout>}/><Route path="*" element={<AuthLayout><NotFoundPage/></AuthLayout>}/></Routes></Suspense></RouteErrorBoundary>}
