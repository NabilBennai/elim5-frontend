import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/contrib/auto-render';
import { buildApiUrl } from '../../core/api/api-url';

interface PublicComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface SharedExplanation {
  id: string;
  topic: string;
  level: string;
  answer: string;
  createdAt: string;
  comments: PublicComment[];
}

@Component({
  selector: 'app-shared',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './shared.html',
  styleUrl: './shared.scss',
})
export class Shared {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('answerContent') private answerContent?: ElementRef<HTMLElement>;

  loading = signal(true);
  posting = signal(false);
  error = signal('');
  explanation = signal<SharedExplanation | null>(null);
  renderedAnswer = signal<SafeHtml>('');

  authorName = '';
  comment = '';

  constructor() {
    marked.setOptions({ gfm: true, breaks: true });

    effect(() => {
      const answer = this.explanation()?.answer ?? '';
      const markdownHtml = answer ? (marked.parse(answer) as string) : '';
      const cleanHtml = DOMPurify.sanitize(markdownHtml);
      this.renderedAnswer.set(this.sanitizer.bypassSecurityTrustHtml(cleanHtml));
      setTimeout(() => this.renderMath(), 0);
    });

    this.load();
  }

  load() {
    const shareId = this.route.snapshot.paramMap.get('shareId');
    if (!shareId) {
      this.error.set('Invalid share link');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.http.get<SharedExplanation>(buildApiUrl(`/public/${shareId}`)).subscribe({
      next: (data) => {
        this.explanation.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This shared explanation does not exist or is no longer available');
        this.loading.set(false);
      },
    });
  }

  postComment() {
    const shareId = this.route.snapshot.paramMap.get('shareId');
    const content = this.comment.trim();
    if (!shareId || !content || this.posting()) return;

    this.posting.set(true);
    this.error.set('');

    this.http
      .post<PublicComment>(buildApiUrl(`/public/${shareId}/comments`), {
        authorName: this.authorName.trim() || undefined,
        content,
      })
      .subscribe({
        next: (created) => {
          this.explanation.update((current) =>
            current ? { ...current, comments: [...current.comments, created] } : current,
          );
          this.comment = '';
          this.posting.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to post comment');
          this.posting.set(false);
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
}
