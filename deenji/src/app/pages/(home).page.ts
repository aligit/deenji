import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';
import { TotoComponent } from './toto.component';

@Component({
  selector: 'deenji-home',

  imports: [AnalogWelcomeComponent, TotoComponent],
  template: `
<p>Hello from home page</p>
<!--     <deenji-analog-welcome/> -->
 <!--   <toto/>-->
  `,
})
export default class HomeComponent {
}
