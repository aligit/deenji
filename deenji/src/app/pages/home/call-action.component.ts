import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-call-action',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <section class="bg-primary-600 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <ng-container *transloco="let t">
          <h2 class="text-3xl font-bold mb-4">
            {{ t('readyToFindDreamHome') }}
          </h2>
          <p class="text-xl mb-8 text-primary-100">
            {{ t('contactAgentsToday') }}
          </p>
          <button
            class="bg-white text-primary-700 px-8 py-3 rounded-md font-semibold hover:bg-primary-50 transition-colors"
          >
            {{ t('getStartedButton') }}
          </button>
        </ng-container>
      </div>
    </section>
  `,
})
export class CallActionComponent {}
