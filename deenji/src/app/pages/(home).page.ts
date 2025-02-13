import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'deenji-home',
  
  imports: [AnalogWelcomeComponent],
  template: `
     <deenji-analog-welcome/>
  `,
})
export default class HomeComponent {
}
