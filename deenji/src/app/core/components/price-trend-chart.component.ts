import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Chart } from 'chart.js/auto';

interface PriceHistory {
  date: string;
  price: number;
}

@Component({
  selector: 'app-price-trend-chart',
  standalone: true,
  template: `
    <div class="h-64">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      /* No additional styles needed; Chart.js handles responsiveness */
    `,
  ],
})
export class PriceTrendChartComponent implements AfterViewInit {
  @Input() priceHistory: PriceHistory[] = [];
  @ViewChild('chartCanvas') chartCanvas: ElementRef | undefined;

  ngAfterViewInit() {
    if (this.chartCanvas && this.priceHistory.length > 0) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.priceHistory.map((item) => item.date),
            datasets: [
              {
                label: 'قیمت تاریخی',
                data: this.priceHistory.map((item) => item.price),
                borderColor: '#2e8b57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'تاریخ',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'قیمت (تومان)',
                },
                ticks: {
                  callback: function (value) {
                    return value.toLocaleString('fa-IR');
                  },
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return context.parsed.y.toLocaleString('fa-IR');
                  },
                },
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      }
    }
  }
}
