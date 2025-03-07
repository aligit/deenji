// src/app/pages/(home).page.ts
import { Component } from '@angular/core';
import { FeaturedComponent } from './home/featured.component';
import { StickySearchComponent } from './home/sticky-search.component';
import { CallActionComponent } from './home/call-action.component';
import { HeroComponent } from './home/hero.component';
import { NavbarComponent } from '../shared/navbar.component';
import { CommonModule } from '@angular/common';

import { waitFor } from '@analogjs/trpc';
import { injectTrpcClient } from '../../trpc-client';
import { Subject, switchMap, shareReplay } from 'rxjs';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FeaturedComponent,
    StickySearchComponent,
    HeroComponent,
    CallActionComponent,
    NavbarComponent,
  ],
  template: `
    <!-- Home-specific navbar with Tailwind positioning -->
    <app-navbar class="fixed top-6 left-0 right-0 z-50" />

    <!-- Sticky search that appears on scroll -->
    <app-sticky-search />

    <!-- Hero section -->
    <app-hero />

    <!-- Main content -->
    <main class="flex-1">
      <app-featured />
      <app-call-action />
    </main>
  `,
})
export default class HomeComponent {
  private _trpc = injectTrpcClient();

  public triggerRefresh$ = new Subject<void>();
  public notes$ = this.triggerRefresh$.pipe(
    switchMap(() => this._trpc.note.list.query()),
    shareReplay(1)
  );
  public newNote = '';

  constructor() {
    void waitFor(this.notes$);
    this.triggerRefresh$.next();
  }
}
