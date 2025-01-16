import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'deenji-webapp-home',
  
  imports: [AnalogWelcomeComponent],
  template: `
     <deenji-webapp-analog-welcome/>
  `,
})
export default class HomeComponent {
}
