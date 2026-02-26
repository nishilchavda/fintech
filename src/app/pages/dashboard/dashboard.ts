import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { Chart } from 'chart.js/auto';
import { NgFor } from '@angular/common';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, AfterViewInit {

  transactions: any[] = [];
  budgets: any[] = [];
  chart!: Chart;
  incomeChart!: Chart;

  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

  constructor(private txService: TransactionService, private budgetService: BudgetService) { }

  ngOnInit() {
    this.txService.getTransactions().subscribe((data: any[]) => {
      this.transactions = data;
      this.calculateSummary();
      this.renderChart();
    });

    this.budgetService.getBudgets().subscribe((data: any[]) => {
      this.budgets = data;
    });
  }

  ngAfterViewInit() { }

  calculateSummary() {
    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((a, b) => a + Number(b.amount), 0);

    this.totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    this.balance = this.totalIncome - this.totalExpense;
  }

  renderChart() {
    if (this.chart) this.chart.destroy();
    if (this.incomeChart) this.incomeChart.destroy();

    const categoryMap: { [key: string]: number } = {};
    const incomeMap: { [key: string]: number } = {};
    this.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] =
          (categoryMap[t.category] || 0) + Number(t.amount);
      });
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeMap[t.category] =
          (incomeMap[t.category] || 0) + Number(t.amount);
      });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap) as number[];
    const incomeLabels = Object.keys(incomeMap);
    const incomeData = Object.values(incomeMap) as number[];
    this.chart = new Chart('expenseChart', {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data
        }]
      }
    });
    this.incomeChart = new Chart('incomeChart', {
      type: 'pie',
      data: {
        labels: incomeLabels,
        datasets: [{
          data: incomeData
        }]
      }
    });
  }

  getSpent(category: string): number {
    return this.transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  exportCSV() {
    const csv = Papa.unparse(this.transactions);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'finance-report.csv';
    link.click();
  }
}