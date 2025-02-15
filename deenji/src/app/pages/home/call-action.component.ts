import { Component } from "@angular/core";

@Component({
  selector: "app-call-action",
  template: `
    <section class="bg-primary-600 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-4">
          آماده هستید تا خانه رویایی خود را پیدا کنید؟
        </h2>
        <p class="text-xl mb-8 text-primary-100">
          امروز با عوامل متخصص ما در ارتباط باشید
        </p>
        <button
          class="bg-white text-primary-700 px-8 py-3 rounded-md font-semibold hover:bg-primary-50 transition-colors"
        >
          شروع کنید
        </button>
      </div>
    </section>
  `,
})
export class CallActionComponent { }
