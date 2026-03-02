import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { BudgetService } from '../../services/budget.service';
import { TransactionService } from '../../services/transaction.service';
import { Chart } from 'chart.js/auto';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-budgets',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, DecimalPipe, FormsModule],
    templateUrl: './budgets.html',
    styleUrl: './budgets.css'
})
export class Budgets implements OnInit, AfterViewInit, OnDestroy {

    budgets: any[] = [];
    transactions: any[] = [];

    showForm = false;
    editingBudget: any = null;
    budgetCategory = '';
    budgetLimit!: number;
    successMessage = '';

    totalBudgetLimit = 0;
    totalSpent = 0;
    totalRemaining = 0;

    categories = [
        'Food', 'Transport', 'Shopping', 'Entertainment', 'Health',
        'Education', 'Rent', 'Utilities', 'Travel', 'Other'
    ];

    chartColors = [
        '#06d6a0', '#3b82f6', '#8b5cf6', '#f59e0b',
        '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];

    private budgetUsageChart!: Chart;

    constructor(
        private budgetService: BudgetService,
        private txService: TransactionService
    ) { }

    ngOnInit() {
        this.budgetService.getBudgets().subscribe((data: any[]) => {
            this.budgets = data;
            this.calculateTotals();
            setTimeout(() => this.renderChart(), 200);
        });

        this.txService.getTransactions().subscribe((data: any[]) => {
            this.transactions = data;
            this.calculateTotals();
            setTimeout(() => this.renderChart(), 200);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.renderChart(), 600);
    }

    ngOnDestroy() {
        if (this.budgetUsageChart) this.budgetUsageChart.destroy();
    }

    calculateTotals() {
        this.totalBudgetLimit = this.budgets.reduce((sum, b) => sum + Number(b.limit), 0);
        this.totalSpent = this.budgets.reduce((sum, b) => sum + this.getSpent(b.category), 0);
        this.totalRemaining = this.totalBudgetLimit - this.totalSpent;
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

    getBudgetColor(budget: any, index: number): string {
        const pct = this.getBudgetPercent(budget);
        if (pct >= 90) return '#ef4444';
        if (pct >= 70) return '#f59e0b';
        return this.chartColors[index % this.chartColors.length];
    }

    saveBudget() {
        if (!this.budgetCategory || !this.budgetLimit) return;

        if (this.editingBudget) {
            // Delete old and re-create (service has no update method)
            this.budgetService.deleteBudget(this.editingBudget.id).then(() => {
                this.budgetService.setBudget(this.budgetCategory, this.budgetLimit);
                this.showSuccess('Budget updated successfully!');
            });
        } else {
            this.budgetService.setBudget(this.budgetCategory, this.budgetLimit);
            this.showSuccess('Budget created successfully!');
        }

        this.resetForm();
    }

    editBudget(budget: any) {
        this.editingBudget = budget;
        this.budgetCategory = budget.category;
        this.budgetLimit = budget.limit;
        this.showForm = true;
    }

    deleteBudget(id: string) {
        this.budgetService.deleteBudget(id).then(() => {
            this.showSuccess('Budget deleted.');
        });
    }

    resetForm() {
        this.budgetCategory = '';
        this.budgetLimit = 0;
        this.editingBudget = null;
        this.showForm = false;
    }

    private showSuccess(message: string) {
        this.successMessage = message;
        setTimeout(() => {
            this.successMessage = '';
        }, 3000);
    }

    // ── Chart ──

    renderChart() {
        const canvas = document.getElementById('budgetUsageChart') as HTMLCanvasElement;
        if (!canvas) return;
        if (this.budgetUsageChart) this.budgetUsageChart.destroy();

        if (this.budgets.length === 0) {
            this.budgetUsageChart = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: ['No budgets'],
                    datasets: [{ data: [1], backgroundColor: ['#1f2937'], borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#64748b', font: { family: 'DM Sans', size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
                        }
                    }
                }
            });
            return;
        }

        const labels = this.budgets.map(b => b.category);
        const spent = this.budgets.map(b => this.getSpent(b.category));
        const remaining = this.budgets.map(b => Math.max(0, Number(b.limit) - this.getSpent(b.category)));

        this.budgetUsageChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Spent',
                        data: spent,
                        backgroundColor: this.budgets.map((b, i) => {
                            const pct = this.getBudgetPercent(b);
                            if (pct >= 90) return 'rgba(239, 68, 68, 0.8)';
                            if (pct >= 70) return 'rgba(245, 158, 11, 0.8)';
                            return 'rgba(6, 214, 160, 0.8)';
                        }),
                        borderRadius: 4
                    },
                    {
                        label: 'Remaining',
                        data: remaining,
                        backgroundColor: 'rgba(31, 41, 55, 0.5)',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: 'rgba(31, 41, 55, 0.5)' },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'DM Sans', size: 11 },
                            callback: (value: any) => '₹' + Number(value).toLocaleString()
                        },
                        border: { display: false }
                    },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { family: 'DM Sans', size: 12 } },
                        border: { display: false }
                    }
                },
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
}
