import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Explanation {
  id: string;
  topic: string;
  answer: string;
  createdAt: string;
}

@Component({
  selector: 'app-explain',
  imports: [FormsModule, DatePipe],
  templateUrl: './explain.html',
})
export class Explain {
  private http = inject(HttpClient);

  topic = '';
  loading = signal(false);
  currentAnswer = signal<Explanation | null>(null);
  history = signal<Explanation[]>([]);
  error = signal('');

  constructor() {
    this.loadHistory();
  }

  submit() {
    const value = this.topic.trim();
    if (!value || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.currentAnswer.set(null);

    this.http.post<Explanation>('http://localhost:3000/explain', { topic: value }).subscribe({
      next: (res) => {
        this.currentAnswer.set(res);
        this.history.update((h) => [res, ...h]);
        this.topic = '';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }

  loadHistory() {
    this.http.get<Explanation[]>('http://localhost:3000/explain/history').subscribe({
      next: (data) => this.history.set(data),
    });
  }

  showFromHistory(item: Explanation) {
    this.currentAnswer.set(item);
  }
}
