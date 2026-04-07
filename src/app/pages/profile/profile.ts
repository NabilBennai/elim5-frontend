import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { buildApiUrl } from '../../core/api/api-url';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface MeResponse {
  id: string;
  email: string;
  createdAt: string;
}

interface SubscriptionResponse {
  isActive: boolean;
  planId: 'free' | 'starter' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

interface CreditWindow {
  key: 'fiveHours' | 'daily' | 'weekly';
  label: string;
  windowHours: number;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

interface CreditsResponse {
  allowed: boolean;
  planId: 'free' | 'starter' | 'pro';
  windows: CreditWindow[];
}

interface PortalResponse {
  url: string;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './profile.html',
})
export class Profile {
  private http = inject(HttpClient);
  private fb = inject(NonNullableFormBuilder);

  loading = signal(true);
  me = signal<MeResponse | null>(null);
  subscription = signal<SubscriptionResponse | null>(null);
  credits = signal<CreditsResponse | null>(null);

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  savingPassword = signal(false);
  passwordError = signal('');
  passwordSuccess = signal('');
  portalLoading = signal(false);
  portalError = signal('');

  constructor() {
    this.loadData();
  }

  tierLabelKey() {
    const planId = this.subscription()?.planId || this.credits()?.planId || 'free';
    return `nav.tier.${planId}`;
  }

  onSubmitPassword() {
    if (this.form.invalid || this.savingPassword()) return;

    const value = this.form.getRawValue();
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (value.newPassword !== value.confirmPassword) {
      this.passwordError.set('profile.password.mismatch');
      return;
    }

    this.savingPassword.set(true);
    this.http
      .patch<{ message: string }>(buildApiUrl('/auth/me/password'), {
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      })
      .subscribe({
        next: (res) => {
          this.passwordSuccess.set(res.message || 'profile.password.success');
          this.form.reset();
          this.savingPassword.set(false);
        },
        error: (err) => {
          this.passwordError.set(err.error?.message || 'profile.password.failed');
          this.savingPassword.set(false);
        },
      });
  }

  openBillingPortal() {
    if (this.portalLoading()) return;
    this.portalError.set('');
    this.portalLoading.set(true);

    this.http.post<PortalResponse>(buildApiUrl('/pricing/portal'), {}).subscribe({
      next: (res) => {
        if (!res.url) {
          this.portalError.set('profile.billing.portalFailed');
          this.portalLoading.set(false);
          return;
        }
        window.location.assign(res.url);
      },
      error: (err) => {
        this.portalError.set(err.error?.message || 'profile.billing.portalFailed');
        this.portalLoading.set(false);
      },
    });
  }

  private loadData() {
    this.loading.set(true);

    this.http.get<MeResponse>(buildApiUrl('/auth/me')).subscribe({
      next: (me) => this.me.set(me),
    });

    this.http.get<SubscriptionResponse>(buildApiUrl('/pricing/subscription')).subscribe({
      next: (sub) => this.subscription.set(sub),
    });

    this.http.get<CreditsResponse>(buildApiUrl('/explain/credits')).subscribe({
      next: (credits) => {
        this.credits.set(credits);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
