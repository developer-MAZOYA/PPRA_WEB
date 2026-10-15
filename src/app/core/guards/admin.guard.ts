import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  if (auth.isAuthenticated() && auth.isAdmin()) {
    return true;
  }

  // Not logged in → login page
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Logged in but not admin → dashboard with a message
  notify.error('Admin access required');
  router.navigate(['/dashboard']);
  return false;
};