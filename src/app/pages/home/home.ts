import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  constructor(protected auth: AuthService) {}
}
