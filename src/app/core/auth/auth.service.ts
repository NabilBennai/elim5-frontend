import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
const USER_KEY = 'auth_user';
const API = buildApiUrl('/auth');

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storedUser = this.readStoredUser();
  private tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private currentUser = signal<User | null>(this.storedUser);
  private restoringSession: Promise<boolean> | null = null;

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.currentUser() || !!this.tokenState());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    void this.ensureSession();
  }

  get token(): string | null {
    return this.tokenState();
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
    this.clearSession();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async ensureSession(): Promise<boolean> {
    if (this.currentUser()) {
      return true;
    }

    if (!this.token) {
      return false;
    }

    if (!this.restoringSession) {
      this.restoringSession = this.fetchMe();
    }

    return this.restoringSession;
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.tokenState.set(res.access_token);
    this.currentUser.set(res.user);
  }

  private fetchMe(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.http.get<User>(`${API}/me`).subscribe({
        next: (user) => {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUser.set(user);
          this.restoringSession = null;
          resolve(true);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            this.clearSession();
            this.currentUser.set(null);
            this.restoringSession = null;
            resolve(false);
            return;
          }

          // Keep token on transient failures (network/cold start/5xx) so refresh does not force relogin.
          this.restoringSession = null;
          resolve(!!this.tokenState());
        },
      });
    });
  }

  private clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
