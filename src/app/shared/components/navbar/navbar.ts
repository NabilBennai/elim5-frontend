import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  constructor(protected auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
