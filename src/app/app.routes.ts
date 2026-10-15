import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ═══════════ Landing (public root) ═══════════
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page').then(m => m.LandingPage),
    pathMatch: 'full'
  },

  {
    path: 'oauth2/redirect',
    loadComponent: () => import('./features/auth/oauth-redirect/oauth-redirect').then(m => m.OAuthRedirect)
  },

  // ═══════════ App (authenticated) ═══════════
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'my-assets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets/my-assets/my-assets').then(m => m.MyAssets)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
  },

  // ═══════════ Admin only ═══════════
  {
    path: 'assets/draft',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/assets/asset-draft-page/asset-draft-page').then(m => m.AssetDraftPage)
  },
  {
    path: 'assets',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/assets/asset-list/asset-list/asset-list').then(m => m.AssetList)
  },
  {
    path: 'assets/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/assets/asset-form/asset-form/asset-form').then(m => m.AssetForm)
  },
  {
    path: 'assets/:id/edit',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/assets/asset-form/asset-form/asset-form').then(m => m.AssetForm)
  },
  {
    path: 'assets/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/assets/asset-detail/asset-detail/asset-detail').then(m => m.AssetDetail)
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/users/user-list/user-list/user-list').then(m => m.UserList)
  },

  // ═══════════ Fallback ═══════════
  { path: '**', redirectTo: '' }
];