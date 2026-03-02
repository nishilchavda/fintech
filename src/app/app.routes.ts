import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Transactions } from './pages/transactions/transactions';
import { Analytics } from './pages/analytics/analytics';
import { Budgets } from './pages/budgets/budgets';
import { Invoices } from './pages/invoices/invoices';
import { Settings } from './pages/settings/settings';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'register', component: Register },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'transactions', component: Transactions, canActivate: [authGuard] },
  { path: 'analytics', component: Analytics, canActivate: [authGuard] },
  { path: 'budgets', component: Budgets, canActivate: [authGuard] },
  { path: 'invoices', component: Invoices, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] }
];