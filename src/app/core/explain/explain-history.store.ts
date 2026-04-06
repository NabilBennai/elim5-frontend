import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../api/api-url';
import { Explanation } from './explanation.model';

@Injectable({ providedIn: 'root' })
export class ExplainHistoryStore {
  private http = inject(HttpClient);
  private selectedId = signal<string | null>(null);

  history = signal<Explanation[]>([]);
  loaded = signal(false);
  loading = signal(false);
  selected = computed<Explanation | null>(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.history().find((entry) => entry.id === id) ?? null;
  });

  ensureLoaded(force = false) {
    if ((this.loaded() && !force) || this.loading()) return;

    this.loading.set(true);
    this.http.get<Explanation[]>(buildApiUrl('/explain/history')).subscribe({
      next: (entries) => {
        this.history.set(entries);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  select(id: string | null) {
    this.selectedId.set(id);
  }

  upsert(entry: Explanation) {
    this.history.update((items) => {
      const filtered = items.filter((it) => it.id !== entry.id);
      return [entry, ...filtered];
    });
  }
}
