import { Component } from '@angular/core';

@Component({
  selector: 'app-call-action',
  template: `
    <section class="bg-primary-600 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-4" i18n="@@readyToFindDreamHome">
          Are you ready to find your dream home?
        </h2>
        <p class="text-xl mb-8 text-primary-100" i18n="@@contactAgentsToday">
          Contact our expert agents today
        </p>
        <button
          class="bg-white text-primary-700 px-8 py-3 rounded-md font-semibold hover:bg-primary-50 transition-colors"
          i18n="@@getStartedButton"
        >
          Get Started
        </button>
      </div>
    </section>
  `,
})
export class CallActionComponent { }
