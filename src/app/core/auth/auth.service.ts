import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { buildApiUrl } from '../api/api-url';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
}

const TOKEN_KEY = 'access_token';
const API = buildApiUrl('/auth');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    if (this.token) {
      this.fetchMe();
    }
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  register(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/register`, { email, password }).pipe(
      tap((res) => {
        this.setSession(res);
      }),
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/login`, { email, password }).pipe(
      tap((res) => {
        this.setSession(res);
      }),
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    this.currentUser.set(res.user);
  }

  private fetchMe() {
    this.http.get<User>(`${API}/me`).subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => {
        localStorage.removeItem(TOKEN_KEY);
        this.currentUser.set(null);
      },
    });
  }
}
