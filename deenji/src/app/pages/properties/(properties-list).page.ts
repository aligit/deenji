import { Component } from "@angular/core";
import { AnalogWelcomeComponent } from "../analog-welcome.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-properties-list",
  standalone: true,
  imports: [AnalogWelcomeComponent, CommonModule],
  template: `<deenji-analog-welcome />`,
})
export default class PropertiesListComponent { }
