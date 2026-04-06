import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Language } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly languages: Array<{ code: Language; flag: string; labelKey: string }> = [
    { code: 'en', flag: '🇺🇸', labelKey: 'nav.lang.en' },
    { code: 'fr', flag: '🇫🇷', labelKey: 'nav.lang.fr' },
    { code: 'es', flag: '🇪🇸', labelKey: 'nav.lang.es' },
  ];

  constructor(
    protected auth: AuthService,
    protected i18n: I18nService,
  ) {}

  changeLanguage(language: string) {
    void this.i18n.setLanguage(language);
  }

  logout() {
    this.auth.logout();
  }
}
