import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'explain',
    loadComponent: () => import('./pages/explain/explain').then((m) => m.Explain),
    canActivate: [authGuard],
  },
  {
    path: 'shared/:shareId',
    loadComponent: () => import('./pages/shared/shared').then((m) => m.Shared),
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing').then((m) => m.Pricing),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
];
