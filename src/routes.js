import { lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const FinancialYears = lazy(() => import('./pages/FinancialYears'));
const Investors = lazy(() => import('./pages/Investors'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Users = lazy(() => import('./pages/Users'));

const routes = [
  {
    path: '/dashboard',
    element: Dashboard,
    protected: true,
  },
  {
    path: '/financial-years',
    element: FinancialYears,
    protected: true,
  },
  {
    path: '/investors',
    element: Investors,
    protected: true,
  },
  {
    path: '/login',
    element: Login,
    protected: false,
  },
  {
    path: '/profile',
    element: Profile,
    protected: true,
  },
  {
    path: '/reports',
    element: Reports,
    protected: true,
  },
  {
    path: '/settings',
    element: Settings,
    protected: true,
  },
  {
    path: '/transactions',
    element: Transactions,
    protected: true,
  },
  {
    path: '/transactions/:userId',
    element: Transactions,
    protected: true,
  },
  {
    path: '/users',
    element: Users,
    protected: true,
  },
  {
    path: '/',
    element: Dashboard,
    protected: true,
  }
];

export default routes; 