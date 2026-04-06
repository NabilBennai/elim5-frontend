import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Language } from '../../../core/i18n/i18n.service';
import { ExplainHistoryStore } from '../../../core/explain/explain-history.store';
import { Explanation } from '../../../core/explain/explanation.model';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private historyStore = inject(ExplainHistoryStore);
  private router = inject(Router);
  protected readonly languages: Array<{ code: Language; flag: string; labelKey: string }> = [
    { code: 'en', flag: 'US', labelKey: 'nav.lang.en' },
    { code: 'fr', flag: 'FR', labelKey: 'nav.lang.fr' },
    { code: 'es', flag: 'ES', labelKey: 'nav.lang.es' },
  ];
  protected readonly mobileOpen = signal(false);
  protected readonly collapsed = signal(false);
  protected readonly history = this.historyStore.history;
  protected readonly selectedHistory = this.historyStore.selected;

  constructor(
    protected auth: AuthService,
    protected i18n: I18nService,
  ) {
    this.applySidebarWidth();

    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.historyStore.ensureLoaded();
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
    this.closeSidebar();
  }

  openHistory(item: Explanation) {
    this.historyStore.select(item.id);
    this.closeSidebar();
    void this.router.navigateByUrl('/explain');
  }

  private applySidebarWidth() {
    const width = this.collapsed() ? '92px' : '270px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }
}
