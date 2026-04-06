import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = '';

  onSubmit() {
    if (this.form.invalid) return;

    this.error = '';
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
      },
    });
  }
}
