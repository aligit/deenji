import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FeaturedComponent } from "./home/featured.component";
import { StickySearchComponent } from "./home/sticky-search.component";
import { CallActionComponent } from "./home/call-action.component";
import { HeroComponent } from "./home/hero.component";

import { waitFor } from "@analogjs/trpc";
import { injectTrpcClient } from "../../trpc-client";
import { Subject, switchMap, shareReplay } from "rxjs";
import { AngularSvgIconModule } from "angular-svg-icon";

@Component({
  standalone: true,
  imports: [
    RouterOutlet,
    AngularSvgIconModule,
    FeaturedComponent,
    StickySearchComponent,
    HeroComponent,
    CallActionComponent,
  ],
  template: `
    <app-sticky-search />
    <app-hero />
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
    shareReplay(1),
  );
  public newNote = "";

  constructor() {
    void waitFor(this.notes$);
    this.triggerRefresh$.next();
  }
}
