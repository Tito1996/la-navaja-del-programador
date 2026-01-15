import { Routes } from '@angular/router';

export const routes: Routes = [
    {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home').then(m => m.Home),
  },
  {
    path: 'tools',
    loadChildren: () =>
      import('./features/tools/tools.routes').then(m => m.TOOLS_ROUTES),
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/favorites').then(m => m.Favorites),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history').then(m => m.History),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings').then(m => m.Settings),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then(m => m.NotFound),
  },
];
