import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TeamComparison, WorkTrend } from '../../core/models/interfaces';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexFill
} from 'ng-apexcharts';

export type TrendChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  colors: string[];
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';

  teamComparisons: TeamComparison[] = [];
  workTrends: WorkTrend[] = [];

  public trendChartOptions: Partial<TrendChartOptions> | any;

  constructor(private api: ApiService) {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.api.getTeamComparison(this.startDate, this.endDate).subscribe({
      next: (res) => this.teamComparisons = res,
      error: (err) => console.error('Failed to load team comparisons', err)
    });

    this.api.getWorkTrends(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.workTrends = res;
        this.renderChart();
      },
      error: (err) => console.error('Failed to load work trends', err)
    });
  }

  renderChart() {
    const dates = this.workTrends.map(t => t.date);
    const wfo = this.workTrends.map(t => t.wfoCount);
    const wfh = this.workTrends.map(t => t.wfhCount);
    const onLeave = this.workTrends.map(t => t.leaveCount);

    this.trendChartOptions = {
      series: [
        { name: 'WFO', data: wfo },
        { name: 'WFH', data: wfh },
        { name: 'On Leave', data: onLeave }
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: ['#4f46e5', '#10b981', '#f59e0b'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: dates,
        type: 'datetime',
        labels: {
          style: { cssClass: 'text-xs font-sans fill-[var(--text-secondary)]' }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { cssClass: 'text-xs font-sans fill-[var(--text-secondary)]' }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: 'var(--text-secondary)' }
      },
      tooltip: { theme: 'dark' }
    };
  }

  exportTeamComparisonPDF() {
    this.api.exportTeamComparison(this.startDate, this.endDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-comparison-${this.startDate}-to-${this.endDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed', err)
    });
  }
}
