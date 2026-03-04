import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { EmployeeReportCard } from '../../core/models/interfaces';

@Component({
  selector: 'app-employee-report-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-report-card.component.html',
})
export class EmployeeReportCardComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  reportCards: EmployeeReportCard[] = [];
  filteredCards: EmployeeReportCard[] = [];
  searchQuery: string = '';

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
    this.api.getEmployeeReportCards(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.reportCards = res;
        this.applyFilter();
      },
      error: (err) => console.error('Failed to load employee cards', err)
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filteredCards = this.reportCards.filter(card =>
      card.employeeName.toLowerCase().includes(q) ||
      (card.employeeCode && card.employeeCode.toLowerCase().includes(q)) ||
      (card.teamName && card.teamName.toLowerCase().includes(q))
    );
  }

  exportExcel() {
    this.api.exportEmployeeCards(this.startDate, this.endDate, 'excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-report-cards-${this.startDate}-to-${this.endDate}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Excel Export failed', err)
    });
  }

  exportCSV() {
    this.api.exportEmployeeCards(this.startDate, this.endDate, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-report-cards-${this.startDate}-to-${this.endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('CSV Export failed', err)
    });
  }
}
