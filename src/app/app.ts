import { Component, signal, afterNextRender } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';

declare const HSStaticMethods: { autoInit: () => void };

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private router: Router) {
    afterNextRender(() => {
      HSStaticMethods.autoInit();
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => HSStaticMethods.autoInit(), 100);
    });
  }
}
