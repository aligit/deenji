import { Component, inject } from "@angular/core";
import { CommonModule, ViewportScroller } from "@angular/common";
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from "@angular/router";
// import { Category } from './models';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatListModule } from '@angular/material/list';
// import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from "rxjs";
// import { MatIconModule } from '@angular/material/icon';
// import { DataLoaderService } from '../../services/data-loader.service';

@Component({
  selector: "app-properties-list",
  standalone: true,
  imports: [
    CommonModule,
    // MatCardModule,
    // MatButtonModule,
    // MatDividerModule,
    // MatSidenavModule,
    // MatListModule,
    // MatIconModule,
  ],
  template: `<div><p>Search</p></div>`,
})
export default class PropertiesListComponent {
  ngOnInit() { }
  ngAfterViewInit() { }
}
