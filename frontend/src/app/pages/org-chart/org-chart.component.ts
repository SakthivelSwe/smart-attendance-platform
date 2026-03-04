import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Employee, Group, Team } from '../../core/models/interfaces';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-chart.component.html',
  styles: [`
    .org-node {
      transition: all 0.3s ease;
    }
  `]
})
export class OrgChartComponent implements OnInit {
  isLoading = true;
  groups: Group[] = [];
  teams: Team[] = [];
  employees: Employee[] = [];

  orgStructure: any[] = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      groups: this.api.getGroups(),
      teams: this.api.getActiveTeams(),
      employees: this.api.getEmployees()
    }).subscribe({
      next: (data) => {
        this.groups = data.groups;
        this.teams = data.teams;
        this.employees = data.employees;
        this.buildStructure();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load org chart data', err);
        this.isLoading = false;
      }
    });
  }

  buildStructure() {
    // Top Level: Groups
    this.orgStructure = this.groups.map(group => {
      // Find teams in this group
      const currentTeams = this.teams.filter(t => t.groupId === group.id);

      const parsedTeams = currentTeams.map(team => {
        // Find employees in this team
        const currentEmployees = this.employees.filter(e => e.teamId === team.id && e.isActive);
        return {
          ...team,
          members: currentEmployees
        };
      });

      return {
        ...group,
        teams: parsedTeams
      };
    });

    // Handle Unassigned (No Group)
    const teamsWithNoGroup = this.teams.filter(t => !t.groupId);
    if (teamsWithNoGroup.length > 0) {
      const parsedUnassignedTeams = teamsWithNoGroup.map(team => {
        const currentEmployees = this.employees.filter(e => e.teamId === team.id && e.isActive);
        return { ...team, members: currentEmployees };
      });
      this.orgStructure.push({
        id: 'unassigned-group',
        name: 'Independent Teams',
        teams: parsedUnassignedTeams
      });
    }

    // Handle No Team Employees
    const empNoTeam = this.employees.filter(e => !e.teamId && e.isActive);
    if (empNoTeam.length > 0) {
      this.orgStructure.push({
        id: 'no-team',
        name: 'Unassigned Personnel',
        teams: [
          {
            id: 'no-team-wrapper',
            name: 'Direct Reports',
            members: empNoTeam
          }
        ]
      });
    }
  }
}
