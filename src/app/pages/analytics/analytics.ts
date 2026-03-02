import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { Chart } from 'chart.js/auto';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, RouterLink],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit, AfterViewInit, OnDestroy {

  transactions: any[] = [];
  budgets: any[] = [];

  totalIncome = 0;
  totalExpense = 0;
  balance = 0;
  savingsRate = 0;
  incomeTransactionCount = 0;
  expenseTransactionCount = 0;
  avgDailyIncome = 0;
  avgDailyExpense = 0;
  largestExpense = 0;

  topExpenseCategories: { category: string; amount: number; percent: number }[] = [];

  periods = ['All', 'This Month', 'Last 7 Days'];
  selectedPeriod = 'All';

  chartColors = [
    '#06d6a0', '#3b82f6', '#8b5cf6', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
  ];

  private monthlyTrendChart!: Chart;
  private expenseBreakdownChart!: Chart;
  private incomeSourcesChart!: Chart;
  private categoryComparisonChart!: Chart;

  constructor(
    private txService: TransactionService,
    private budgetService: BudgetService
  ) {}

  ngOnInit() {
    this.txService.getTransactions().subscribe((data: any[]) => {
      this.transactions = data;
      this.recalculate();
    });

    this.budgetService.getBudgets().subscribe((data: any[]) => {
      this.budgets = data;
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderAllCharts(), 600);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  recalculate() {
    const filtered = this.getFilteredTransactions();
    this.calculateSummary(filtered);
    this.calculateTopCategories(filtered);
    setTimeout(() => this.renderAllCharts(), 100);
  }

  getFilteredTransactions(): any[] {
    const now = new Date();
    if (this.selectedPeriod === 'This Month') {
      return this.transactions.filter(t => {
        const d = this.parseDate(t.createdAt);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    if (this.selectedPeriod === 'Last 7 Days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return this.transactions.filter(t => {
        const d = this.parseDate(t.createdAt);
        return d && d >= sevenDaysAgo;
      });
    }
    return this.transactions;
  }

  parseDate(value: any): Date | null {
    if (!value) return null;
    if (value.toDate) return value.toDate(); // Firestore Timestamp
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  calculateSummary(txns: any[]) {
    const incomeTxns = txns.filter(t => t.type === 'income');
    const expenseTxns = txns.filter(t => t.type === 'expense');

    this.totalIncome = incomeTxns.reduce((a, b) => a + Number(b.amount), 0);
    this.totalExpense = expenseTxns.reduce((a, b) => a + Number(b.amount), 0);
    this.balance = this.totalIncome - this.totalExpense;
    this.incomeTransactionCount = incomeTxns.length;
    this.expenseTransactionCount = expenseTxns.length;
    this.savingsRate = this.totalIncome > 0
      ? Math.round((this.balance / this.totalIncome) * 100)
      : 0;

    // Largest expense
    this.largestExpense = expenseTxns.length > 0
      ? Math.max(...expenseTxns.map(t => Number(t.amount)))
      : 0;

    // Daily averages - compute based on date range
    const dates = txns.map(t => this.parseDate(t.createdAt)).filter(d => d !== null) as Date[];
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const days = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      this.avgDailyIncome = Math.round(this.totalIncome / days);
      this.avgDailyExpense = Math.round(this.totalExpense / days);
    } else {
      this.avgDailyIncome = 0;
      this.avgDailyExpense = 0;
    }
  }

  calculateTopCategories(txns: any[]) {
    const categoryMap: { [key: string]: number } = {};
    txns
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const sorted = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const maxAmount = sorted.length > 0 ? sorted[0][1] : 1;
    this.topExpenseCategories = sorted.map(([category, amount]) => ({
      category,
      amount,
      percent: Math.round((amount / maxAmount) * 100)
    }));
  }

  // ── Charts ──

  destroyCharts() {
    if (this.monthlyTrendChart) this.monthlyTrendChart.destroy();
    if (this.expenseBreakdownChart) this.expenseBreakdownChart.destroy();
    if (this.incomeSourcesChart) this.incomeSourcesChart.destroy();
    if (this.categoryComparisonChart) this.categoryComparisonChart.destroy();
  }

  renderAllCharts() {
    this.destroyCharts();
    this.renderMonthlyTrendChart();
    this.renderExpenseBreakdownChart();
    this.renderIncomeSourcesChart();
    this.renderCategoryComparisonChart();
  }

  renderMonthlyTrendChart() {
    const canvas = document.getElementById('monthlyTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const filtered = this.getFilteredTransactions();
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    filtered.forEach(t => {
      const d = this.parseDate(t.createdAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      if (t.type === 'income') monthlyData[key].income += Number(t.amount);
      else monthlyData[key].expense += Number(t.amount);
    });

    const sortedKeys = Object.keys(monthlyData).sort();
    const monthLabels = sortedKeys.map(k => {
      const [y, m] = k.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(m) - 1]} ${y}`;
    });

    const labels = monthLabels.length > 0 ? monthLabels : ['No Data'];
    const incomeData = sortedKeys.length > 0 ? sortedKeys.map(k => monthlyData[k].income) : [0];
    const expenseData = sortedKeys.length > 0 ? sortedKeys.map(k => monthlyData[k].expense) : [0];

    this.monthlyTrendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#06d6a0',
            backgroundColor: 'rgba(6, 214, 160, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#06d6a0',
            pointBorderColor: '#06d6a0',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ef4444',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 12
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
              callback: (value: any) => '₹' + Number(value).toLocaleString()
            },
            border: { display: false }
          }
        }
      }
    });
  }

  renderExpenseBreakdownChart() {
    const canvas = document.getElementById('expenseBreakdownChart') as HTMLCanvasElement;
    if (!canvas) return;

    const filtered = this.getFilteredTransactions();
    const categoryMap: { [key: string]: number } = {};
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap) as number[];

    this.expenseBreakdownChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No expenses'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: this.chartColors,
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

  renderIncomeSourcesChart() {
    const canvas = document.getElementById('incomeSourcesChart') as HTMLCanvasElement;
    if (!canvas) return;

    const filtered = this.getFilteredTransactions();
    const incomeMap: { [key: string]: number } = {};
    filtered
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeMap[t.category] = (incomeMap[t.category] || 0) + Number(t.amount);
      });

    const labels = Object.keys(incomeMap);
    const data = Object.values(incomeMap) as number[];

    this.incomeSourcesChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No income'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: [...this.chartColors].reverse(),
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

  renderCategoryComparisonChart() {
    const canvas = document.getElementById('categoryComparisonChart') as HTMLCanvasElement;
    if (!canvas) return;

    const filtered = this.getFilteredTransactions();
    const categoryMap: { [key: string]: number } = {};
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.length > 0 ? sorted.map(s => s[0]) : ['No Data'];
    const data = sorted.length > 0 ? sorted.map(s => s[1]) : [0];

    this.categoryComparisonChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Amount Spent',
          data,
          backgroundColor: sorted.map((_, i) => this.chartColors[i % this.chartColors.length] + 'cc'),
          borderColor: sorted.map((_, i) => this.chartColors[i % this.chartColors.length]),
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(31, 41, 55, 0.5)' },
            ticks: {
              color: '#64748b',
              font: { family: 'DM Sans', size: 12 },
              callback: (value: any) => '₹' + Number(value).toLocaleString()
            },
            border: { display: false }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'DM Sans', size: 12 } },
            border: { display: false }
          }
        }
      }
    });
  }
}
