import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/footer.component';
import { NavbarComponent } from './shared/navbar.component';

@Component({
  selector: 'deenji-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `<app-navbar/> <router-outlet></router-outlet><app-footer/>`,
})
export class AppComponent { }
