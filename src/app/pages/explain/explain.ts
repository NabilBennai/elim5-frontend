import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { buildApiUrl } from '../../core/api/api-url';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/contrib/auto-render';

type ExplanationLevel = 'ELI5' | 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

interface Explanation {
  id: string;
  topic: string;
  level: ExplanationLevel;
  answer: string;
  createdAt: string;
}

@Component({
  selector: 'app-explain',
  imports: [FormsModule, DatePipe],
  templateUrl: './explain.html',
  styleUrl: './explain.scss',
})
export class Explain {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  protected readonly levels: ExplanationLevel[] = ['ELI5', 'BEGINNER', 'INTERMEDIATE', 'EXPERT'];
  @ViewChild('answerContent') private answerContent?: ElementRef<HTMLElement>;

  topic = '';
  loading = signal(false);
  selectedLevel = signal<ExplanationLevel>('ELI5');
  currentAnswer = signal<Explanation | null>(null);
  history = signal<Explanation[]>([]);
  error = signal('');
  renderedAnswer = signal<SafeHtml>('');

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    effect(() => {
      const answer = this.currentAnswer()?.answer ?? '';
      const normalized = answer ? this.normalizeAnswer(answer) : '';
      const markdownHtml = normalized ? (marked.parse(normalized) as string) : '';
      const cleanHtml = DOMPurify.sanitize(markdownHtml);
      this.renderedAnswer.set(this.sanitizer.bypassSecurityTrustHtml(cleanHtml));
      setTimeout(() => this.renderMath(), 0);
    });

    this.loadHistory();
  }

  submit(topicOverride?: string, levelOverride?: ExplanationLevel) {
    const value = (topicOverride ?? this.topic).trim();
    const level = levelOverride ?? this.selectedLevel();
    if (!value || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.currentAnswer.set(null);

    this.http.post<Explanation>(buildApiUrl('/explain'), { topic: value, level }).subscribe({
      next: (res) => {
        this.currentAnswer.set(res);
        this.selectedLevel.set(res.level);
        this.history.update((h) => [res, ...h]);
        this.topic = value;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }

  loadHistory() {
    this.http.get<Explanation[]>(buildApiUrl('/explain/history')).subscribe({
      next: (data) => this.history.set(data),
    });
  }

  regenerateAtLevel(level: ExplanationLevel) {
    const currentTopic = this.currentAnswer()?.topic ?? this.topic.trim();
    if (!currentTopic) return;
    this.selectedLevel.set(level);
    this.submit(currentTopic, level);
  }

  showFromHistory(item: Explanation) {
    this.currentAnswer.set(item);
    this.selectedLevel.set(item.level);
    this.topic = item.topic;
  }

  levelLabel(level: ExplanationLevel) {
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  private renderMath() {
    if (!this.answerContent) return;

    renderMathInElement(this.answerContent.nativeElement, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  }

  private normalizeAnswer(input: string) {
    return input
      .replace(/\\\\([a-zA-Z])/g, '\\$1')
      .replace(
        /^\s*\[\s*\n([\s\S]*?)\n\s*\]\s*$/gm,
        (_match, formula) => `\n$$\n${formula.trim()}\n$$\n`,
      )
      .replace(/\(\s*\\([a-zA-Z][\s\S]*?)\s*\)/g, (_match, inner) => `$\\${inner.trim()}$`)
      .replace(/\n{3,}/g, '\n\n');
  }
}
