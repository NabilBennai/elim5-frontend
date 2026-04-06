import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { buildApiUrl } from '../../core/api/api-url';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';

interface PricingPlan {
  id: 'free' | 'starter' | 'pro';
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearlyMonthly: number;
  currency: 'EUR';
  limits: {
    fiveHours: number;
    daily: number;
    weekly: number;
  };
  features: string[];
  recommended: boolean;
}

interface PricingResponse {
  paymentEnabled: boolean;
  plans: PricingPlan[];
}

@Component({
  selector: 'app-pricing',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing {
  private http = inject(HttpClient);
  protected auth = inject(AuthService);

  loading = signal(true);
  plans = signal<PricingPlan[]>([]);
  paymentEnabled = signal(false);
  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  checkoutLoadingPlan = signal<string | null>(null);
  checkoutMessage = signal('');

  constructor() {
    this.loadPlans();
  }

  formatPrice(plan: PricingPlan) {
    const price = this.billingCycle() === 'yearly' ? plan.priceYearlyMonthly : plan.priceMonthly;
    if (price === 0) return 'Free';
    return `${price} EUR / month`;
  }

  yearlySavingsPercent(plan: PricingPlan) {
    if (
      !plan.priceMonthly ||
      !plan.priceYearlyMonthly ||
      plan.priceYearlyMonthly >= plan.priceMonthly
    ) {
      return 0;
    }
    return Math.round(((plan.priceMonthly - plan.priceYearlyMonthly) / plan.priceMonthly) * 100);
  }

  checkout(plan: PricingPlan) {
    if (plan.id === 'free') return;
    this.checkoutMessage.set('');
    this.checkoutLoadingPlan.set(plan.id);

    this.http
      .post(buildApiUrl('/pricing/checkout'), {
        planId: plan.id,
        billingCycle: this.billingCycle(),
      })
      .subscribe({
        next: () => {
          this.checkoutLoadingPlan.set(null);
        },
        error: (err: HttpErrorResponse) => {
          const apiMessage = (err.error?.message as string) || '';
          this.checkoutMessage.set(
            apiMessage || 'Payments are not enabled yet. Stripe checkout will be added later.',
          );
          this.checkoutLoadingPlan.set(null);
        },
      });
  }

  private loadPlans() {
    this.http.get<PricingResponse>(buildApiUrl('/pricing/plans')).subscribe({
      next: (res) => {
        this.plans.set(res.plans);
        this.paymentEnabled.set(res.paymentEnabled);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
