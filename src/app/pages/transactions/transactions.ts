import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgClass, DecimalPipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  budgetCategory: string = '';
  budgetLimit!: number;
  amount!: number;
  type: string = 'expense';
  category: string = '';
  description: string = '';

  transactions: any[] = [];
  showBudgetForm: boolean = false;
  successMessage: string = '';

  constructor(
    private txService: TransactionService,
    private budgetService: BudgetService
  ) { }

  ngOnInit() {
    this.txService.getTransactions().subscribe((data: any) => {
      this.transactions = data;
    });
  }

  setBudget() {
    if (!this.budgetCategory || !this.budgetLimit) return;
    this.budgetService.setBudget(this.budgetCategory, this.budgetLimit);
    this.showSuccess('Budget saved successfully!');
    this.budgetCategory = '';
    this.budgetLimit = 0;
    this.showBudgetForm = false;
  }

  addTransaction() {
    if (!this.amount || !this.category) return;
    this.txService.addTransaction({
      amount: this.amount,
      type: this.type,
      category: this.category,
      description: this.description
    });
    this.showSuccess('Transaction added successfully!');
    this.amount = 0;
    this.category = '';
    this.description = '';
  }

  delete(id: string) {
    this.txService.deleteTransaction(id);
    this.showSuccess('Transaction deleted.');
  }

  getTransactionColor(type: string): string {
    return type === 'income' ? '#06d6a0' : '#ef4444';
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}