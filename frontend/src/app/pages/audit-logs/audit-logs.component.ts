import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuditLog } from '../../core/models/interfaces';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  page = 0;
  size = 50;
  totalElements = 0;
  totalPages = 0;
  isLoading = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.api.getAuditLogs(this.page, this.size).subscribe({
      next: (res) => {
        this.logs = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.isLoading = false;
      }
    });
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadLogs();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadLogs();
    }
  }
}
