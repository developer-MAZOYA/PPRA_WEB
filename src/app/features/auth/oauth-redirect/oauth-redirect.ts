import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-oauth-redirect',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="redirect-page">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Signing you in...</p>
    </div>
  `,
  styles: [`
    .redirect-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #003A70 0%, #0071BC 100%);
      color: white;
      gap: 16px;
      text-align: center;
    }
    p { font-size: 1rem; opacity: 0.9; }
  `]
})
export class OAuthRedirect implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.notify.error('No token received from sign-in');
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.auth.handleExternalToken(token);
      this.notify.success('Welcome!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.notify.error('Sign-in failed');
      this.router.navigate(['/login']);
    }
  }
}