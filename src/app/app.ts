import { Component, signal, afterNextRender } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';
import { environment } from '../environments/environment';

declare const HSStaticMethods: { autoInit: () => void };

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal(environment.appTitle);
  protected readonly isDev = !environment.production;

  constructor(private router: Router) {
    document.title = this.title();

    afterNextRender(() => {
      HSStaticMethods.autoInit();
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => HSStaticMethods.autoInit(), 100);
    });
  }
}
