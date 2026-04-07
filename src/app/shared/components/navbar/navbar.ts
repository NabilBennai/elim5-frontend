import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Language } from '../../../core/i18n/i18n.service';
import { ExplainHistoryStore } from '../../../core/explain/explain-history.store';
import { Explanation } from '../../../core/explain/explanation.model';
import { buildApiUrl } from '../../../core/api/api-url';

interface CreditWindow {
  key: 'fiveHours' | 'daily' | 'weekly';
  label: string;
  windowHours: number;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

interface CreditStatus {
  allowed: boolean;
  planId: 'free' | 'starter' | 'pro';
  windows: CreditWindow[];
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  private http = inject(HttpClient);
  private historyStore = inject(ExplainHistoryStore);
  private router = inject(Router);
  private creditsIntervalId: ReturnType<typeof setInterval> | null = null;
  protected readonly languages: Array<{ code: Language; flag: string; labelKey: string }> = [
    { code: 'en', flag: 'US', labelKey: 'nav.lang.en' },
    { code: 'fr', flag: 'FR', labelKey: 'nav.lang.fr' },
    { code: 'es', flag: 'ES', labelKey: 'nav.lang.es' },
  ];
  protected readonly mobileOpen = signal(false);
  protected readonly collapsed = signal(false);
  protected readonly history = this.historyStore.history;
  protected readonly selectedHistory = this.historyStore.selected;
  protected readonly credits = signal<CreditStatus | null>(null);
  protected readonly creditsLoading = signal(false);

  constructor(
    protected auth: AuthService,
    protected i18n: I18nService,
  ) {
    this.applySidebarWidth();

    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.historyStore.ensureLoaded();
        this.loadCredits();
        this.startCreditsPolling();
      } else {
        this.credits.set(null);
        this.stopCreditsPolling();
      }
    });
  }

  changeLanguage(language: string) {
    void this.i18n.setLanguage(language);
  }

  toggleSidebar() {
    this.mobileOpen.update((value) => !value);
  }

  toggleCollapsed() {
    this.collapsed.update((value) => !value);
    this.applySidebarWidth();
  }

  closeSidebar() {
    this.mobileOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.historyStore.select(null);
    this.credits.set(null);
    this.closeSidebar();
  }

  openHistory(item: Explanation) {
    this.historyStore.select(item.id);
    this.closeSidebar();
    void this.router.navigateByUrl('/explain');
  }

  creditProgress(window: CreditWindow) {
    if (window.limit <= 0) return 0;
    return Math.min(100, Math.round((window.used / window.limit) * 100));
  }

  creditClass(window: CreditWindow) {
    if (window.remaining <= 0) return 'progress progress-error w-full h-2';
    if (window.remaining <= Math.max(1, Math.floor(window.limit * 0.15))) {
      return 'progress progress-warning w-full h-2';
    }
    return 'progress progress-success w-full h-2';
  }

  formatReset(resetAt: string) {
    const target = new Date(resetAt).getTime();
    const diff = Math.max(0, target - Date.now());
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  tierLabelKey() {
    const planId = this.credits()?.planId;
    if (!planId) return null;
    return `nav.tier.${planId}`;
  }

  private loadCredits() {
    if (!this.auth.isLoggedIn() || this.creditsLoading()) return;

    this.creditsLoading.set(true);
    this.http.get<CreditStatus>(buildApiUrl('/explain/credits')).subscribe({
      next: (status) => {
        this.credits.set(status);
        this.creditsLoading.set(false);
      },
      error: () => {
        this.creditsLoading.set(false);
      },
    });
  }

  private startCreditsPolling() {
    if (this.creditsIntervalId) return;

    this.creditsIntervalId = setInterval(() => {
      this.loadCredits();
    }, 60_000);
  }

  private stopCreditsPolling() {
    if (!this.creditsIntervalId) return;

    clearInterval(this.creditsIntervalId);
    this.creditsIntervalId = null;
  }

  ngOnDestroy() {
    this.stopCreditsPolling();
  }

  private applySidebarWidth() {
    const width = this.collapsed() ? '92px' : '270px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }
}
