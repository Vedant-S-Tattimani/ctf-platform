import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RouteErrorBoundary } from '@/components/errors/RouteErrorBoundary';
import { RootLayout } from '@/components/layout/RootLayout';
import Home from '@/pages/Home';

const Account = lazy(() => import('@/pages/Account'));
const Admin = lazy(() => import('@/pages/Admin'));
const Challenges = lazy(() => import('@/pages/Challenges'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Profile = lazy(() => import('@/pages/Profile'));
const Register = lazy(() => import('@/pages/Register'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Scoreboard = lazy(() => import('@/pages/Scoreboard'));
const TeamDetail = lazy(() => import('@/pages/TeamDetail'));
const Teams = lazy(() => import('@/pages/Teams'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

const AdminOverview = lazy(() =>
  import('@/features/admin/AdminOverview').then((module) => ({ default: module.AdminOverview })),
);
const AdminChallenges = lazy(() =>
  import('@/features/admin/AdminChallenges').then((module) => ({ default: module.AdminChallenges })),
);
const AdminChallengeEditor = lazy(() =>
  import('@/features/admin/AdminChallengeEditor').then((module) => ({
    default: module.AdminChallengeEditor,
  })),
);
const AdminCategories = lazy(() =>
  import('@/features/admin/AdminCategories').then((module) => ({ default: module.AdminCategories })),
);
const AdminEvents = lazy(() =>
  import('@/features/admin/AdminEvents').then((module) => ({ default: module.AdminEvents })),
);
const AdminListings = lazy(() =>
  import('@/features/admin/AdminListings').then((module) => ({ default: module.AdminListings })),
);

const Kit = import.meta.env.DEV ? lazy(() => import('@/pages/Kit')) : null;

function RouteFallback() {
  return (
    <div
      className="mx-auto flex w-full max-w-container flex-col gap-4 px-4 py-16 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="h-9 w-52 animate-pulse rounded-md bg-elevated" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-elevated" />
      <div className="mt-4 h-64 animate-pulse rounded-lg bg-elevated" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

const page = (element: ReactNode) => <Suspense fallback={<RouteFallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/challenges', element: page(<Challenges />) },
          { path: '/challenges/:challengeId', element: page(<Challenges />) },
          { path: '/scoreboard', element: page(<Scoreboard />) },
          { path: '/teams', element: page(<Teams />) },
          { path: '/teams/:id', element: page(<TeamDetail />) },
          { path: '/users/:id', element: page(<Profile />) },
          { path: '/login', element: page(<Login />) },
          { path: '/register', element: page(<Register />) },
          { path: '/forgot-password', element: page(<ForgotPassword />) },
          { path: '/reset-password', element: page(<ResetPassword />) },
          { path: '/verify-email', element: page(<VerifyEmail />) },
          {
            path: '/account',
            element: <RequireAuth>{page(<Account />)}</RequireAuth>,
          },
          {
            path: '/admin',
            element: <RequireAdmin>{page(<Admin />)}</RequireAdmin>,
            children: [
              { index: true, element: page(<AdminOverview />) },
              { path: 'challenges', element: page(<AdminChallenges />) },
              {
                path: 'challenges/new',
                element: page(<AdminChallengeEditor mode="create" />),
              },
              {
                path: 'challenges/:challengeId',
                element: page(<AdminChallengeEditor />),
              },
              { path: 'categories', element: page(<AdminCategories />) },
              { path: 'events', element: page(<AdminEvents />) },
              { path: 'people', element: page(<AdminListings />) },
            ],
          },
          ...(Kit ? [{ path: '/__kit', element: page(<Kit />) }] : []),
          { path: '*', element: page(<NotFound />) },
        ],
      },
    ],
  },
]);
