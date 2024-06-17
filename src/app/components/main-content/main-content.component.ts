import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css'
})
export class MainContentComponent {
  currentPath: string = '';
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentPath = this.router.url.split('/').slice(1).join('/');
    });
  }
  ngOnInit(): void {
    // Initial load
    this.currentPath = this.router.url.split('/').slice(1).join('/');
  }
}
