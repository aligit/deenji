import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  standalone: true,
  selector: "app-profile",
  imports: [RouterOutlet],
  template: ` <router-outlet></router-outlet> `,
})
export class ProfileComponent { }
