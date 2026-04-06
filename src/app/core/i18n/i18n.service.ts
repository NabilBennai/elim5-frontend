import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Language = 'en' | 'fr' | 'es';

const STORAGE_KEY = 'ui_language';
const SUPPORTED_LANGUAGES: Language[] = ['en', 'fr', 'es'];

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http: HttpClient;
  private dictionaries = new Map<Language, Record<string, string>>();
  private currentDictionary = signal<Record<string, string>>({});
  language = signal<Language>('en');

  constructor(http: HttpClient) {
    this.http = http;
    void this.init();
  }

  async setLanguage(language: string) {
    if (!SUPPORTED_LANGUAGES.includes(language as Language)) return;
    const safeLanguage = language as Language;
    await this.loadLanguage(safeLanguage);
    this.language.set(safeLanguage);
    localStorage.setItem(STORAGE_KEY, safeLanguage);
  }

  translate(key: string) {
    const active = this.currentDictionary();
    if (active[key]) return active[key];
    const fallback = this.dictionaries.get('en');
    return fallback?.[key] ?? key;
  }

  private async init() {
    await this.loadLanguage('en');
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      await this.setLanguage(stored);
      return;
    }
    this.language.set('en');
  }

  private async loadLanguage(language: Language) {
    if (this.dictionaries.has(language)) {
      this.currentDictionary.set(this.dictionaries.get(language)!);
      return;
    }

    const dict = await firstValueFrom(
      this.http.get<Record<string, string>>(`/i18n/${language}.json`),
    );
    this.dictionaries.set(language, dict);
    this.currentDictionary.set(dict);
  }
}
