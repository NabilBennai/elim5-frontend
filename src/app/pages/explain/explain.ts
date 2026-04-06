import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { buildApiUrl } from '../../core/api/api-url';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/contrib/auto-render';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ExplainHistoryStore } from '../../core/explain/explain-history.store';
import { Explanation, ExplanationLevel } from '../../core/explain/explanation.model';

@Component({
  selector: 'app-explain',
  imports: [FormsModule, DatePipe, TranslatePipe],
  templateUrl: './explain.html',
  styleUrl: './explain.scss',
})
export class Explain {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private historyStore = inject(ExplainHistoryStore);
  protected i18n = inject(I18nService);
  protected readonly levels: ExplanationLevel[] = ['ELI5', 'BEGINNER', 'INTERMEDIATE', 'EXPERT'];
  @ViewChild('answerContent') private answerContent?: ElementRef<HTMLElement>;
  @ViewChild('threadContainer') private threadContainer?: ElementRef<HTMLElement>;

  topic = '';
  sourceUrl = '';
  loading = signal(false);
  selectedLevel = signal<ExplanationLevel>('ELI5');
  currentAnswer = signal<Explanation | null>(null);
  history = this.historyStore.history;
  error = signal('');
  shareStatus = signal('');
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
      setTimeout(() => this.scrollThreadToBottom(), 0);
    });

    effect(() => {
      const selected = this.historyStore.selected();
      if (!selected) return;
      this.showFromHistory(selected);
    });

    this.historyStore.ensureLoaded();
  }

  submit(topicOverride?: string, levelOverride?: ExplanationLevel) {
    const value = (topicOverride ?? this.topic).trim();
    const level = levelOverride ?? this.selectedLevel();
    const sourceUrl = this.sourceUrl.trim();
    if (!value || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.shareStatus.set('');
    this.currentAnswer.set(null);
    this.scrollThreadToBottom();

    this.http
      .post<Explanation>(buildApiUrl('/explain'), {
        topic: value,
        level,
        sourceUrl: sourceUrl || undefined,
      })
      .subscribe({
        next: (res) => {
          this.currentAnswer.set(res);
          this.selectedLevel.set(res.level);
          this.historyStore.upsert(res);
          this.historyStore.select(res.id);
          this.topic = value;
          this.loading.set(false);
          this.scrollThreadToBottom();
        },
        error: (err) => {
          this.error.set(err.error?.message || this.i18n.translate('explain.error.generic'));
          this.loading.set(false);
        },
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
    this.sourceUrl = item.sources[0]?.sourceUrl ?? '';
    this.shareStatus.set('');
    this.historyStore.select(item.id);
    setTimeout(() => this.scrollThreadToBottom(), 0);
  }

  levelLabel(level: ExplanationLevel) {
    return this.i18n.translate(`level.${level}`);
  }

  shareCurrent() {
    const current = this.currentAnswer();
    if (!current || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.shareStatus.set('');

    this.http.post<{ shareId: string }>(buildApiUrl(`/explain/${current.id}/share`), {}).subscribe({
      next: async ({ shareId }) => {
        const shared: Explanation = { ...current, shareId };
        this.currentAnswer.set(shared);
        this.historyStore.upsert(shared);
        this.historyStore.select(shared.id);

        const publicUrl = `${window.location.origin}/shared/${shareId}`;
        try {
          await navigator.clipboard.writeText(publicUrl);
          this.shareStatus.set(this.i18n.translate('explain.share.copied'));
        } catch {
          this.shareStatus.set(`${this.i18n.translate('explain.share.failedPrefix')} ${publicUrl}`);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || this.i18n.translate('explain.share.failed'));
        this.loading.set(false);
      },
    });
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

  private scrollThreadToBottom() {
    const node = this.threadContainer?.nativeElement;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
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
