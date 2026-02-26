import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { Chart } from 'chart.js/auto';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {

  transactions: any[] = [];
  budgets: any[] = [];
  expenseChart!: Chart;
  incomeChart!: Chart;
  cashFlowChart!: Chart;

  totalIncome = 0;
  totalExpense = 0;
  balance = 0;
  savingsRate = 0;

  incomeChangePercent = 0;
  expenseChangePercent = 0;

  currentTab = 'week';

  recentTransactions: any[] = [];

  private resizeHandler: (() => void) | null = null;

  constructor(
    private txService: TransactionService,
    private budgetService: BudgetService
  ) { }

  ngOnInit() {
    this.txService.getTransactions().subscribe((data: any[]) => {
      this.transactions = data;
      this.calculateSummary();
      this.recentTransactions = data.slice(0, 6);
    });

    this.budgetService.getBudgets().subscribe((data: any[]) => {
      this.budgets = data;
    });
  }

  ngAfterViewInit() {
    // Charts init will happen when data is available
    setTimeout(() => {
      this.renderCharts();
    }, 500);
  }

  ngOnDestroy() {
    if (this.expenseChart) this.expenseChart.destroy();
    if (this.incomeChart) this.incomeChart.destroy();
    if (this.cashFlowChart) this.cashFlowChart.destroy();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  calculateSummary() {
    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((a, b) => a + Number(b.amount), 0);

    this.totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((a, b) => a + Number(b.amount), 0);

    this.balance = this.totalIncome - this.totalExpense;
    this.savingsRate = this.totalIncome > 0
      ? Math.round((this.balance / this.totalIncome) * 100)
      : 0;
  }

  renderCharts() {
    this.renderCashFlowChart();
    this.renderExpenseChart();
    this.renderIncomeChart();
  }

  renderCashFlowChart() {
    const canvas = document.getElementById('cashFlowChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.cashFlowChart) this.cashFlowChart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Build chart data from transactions
    const categoryExpenses: { [key: string]: number } = {};
    const categoryIncomes: { [key: string]: number } = {};

    this.transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + Number(t.amount);
      } else {
        categoryIncomes[t.category] = (categoryIncomes[t.category] || 0) + Number(t.amount);
      }
    });

    const allCategories = [...new Set([...Object.keys(categoryExpenses), ...Object.keys(categoryIncomes)])];
    const incomeData = allCategories.map(c => categoryIncomes[c] || 0);
    const expenseData = allCategories.map(c => categoryExpenses[c] || 0);

    const labels = allCategories.length > 0 ? allCategories : ['No Data'];
    const incomeValues = incomeData.length > 0 ? incomeData : [0];
    const expenseValues = expenseData.length > 0 ? expenseData : [0];

    this.cashFlowChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeValues,
            backgroundColor: 'rgba(6, 214, 160, 0.8)',
            borderColor: '#06d6a0',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Expenses',
            data: expenseValues,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 12,
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(31, 41, 55, 0.5)' },
            ticks: { color: '#64748b', font: { family: 'DM Sans', size: 12 } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(31, 41, 55, 0.5)' },
            ticks: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 12 },
              callback: (value: any) => '₹' + value.toLocaleString()
            },
            border: { display: false }
          }
        }
      }
    });
  }

  renderExpenseChart() {
    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.expenseChart) this.expenseChart.destroy();

    const categoryMap: { [key: string]: number } = {};
    this.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap) as number[];

    this.expenseChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No expenses'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: [
            '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6',
            '#ec4899', '#14b8a6', '#f97316', '#6366f1'
          ],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          }
        }
      }
    });
  }

  renderIncomeChart() {
    const canvas = document.getElementById('incomeChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.incomeChart) this.incomeChart.destroy();

    const incomeMap: { [key: string]: number } = {};
    this.transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeMap[t.category] = (incomeMap[t.category] || 0) + Number(t.amount);
      });

    const labels = Object.keys(incomeMap);
    const data = Object.values(incomeMap) as number[];

    this.incomeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No income'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: [
            '#06d6a0', '#3b82f6', '#8b5cf6', '#f59e0b',
            '#14b8a6', '#ec4899', '#6366f1', '#f97316'
          ],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          }
        }
      }
    });
  }

  getSpent(category: string): number {
    return this.transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getBudgetPercent(budget: any): number {
    const spent = this.getSpent(budget.category);
    return Math.min(Math.round((spent / budget.limit) * 100), 100);
  }

  isBudgetWarning(budget: any): boolean {
    return this.getBudgetPercent(budget) > 90;
  }

  getBudgetColor(budget: any, index: number): string {
    if (this.isBudgetWarning(budget)) return 'var(--warning)';
    const colors = ['#06d6a0', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
    return colors[index % colors.length];
  }

  exportCSV() {
    const csv = Papa.unparse(this.transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'finance-report.csv';
    link.click();
  }

  getTransactionIcon(type: string): string {
    return type === 'income' ? 'income' : 'expense';
  }

  getTransactionColor(type: string): string {
    return type === 'income' ? '#06d6a0' : '#ef4444';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}