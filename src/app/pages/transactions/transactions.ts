import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule, NgFor],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  budgetCategory!: string;
  budgetLimit!: number;
  amount!: number;
  type: string = 'expense';
  category!: string;
  description!: string;

  transactions: any[] = [];

  constructor(private txService: TransactionService,
    private budgetService: BudgetService) { }

  ngOnInit() {
    this.txService.getTransactions().subscribe((data: any) => {
      this.transactions = data;
    });
  }
  setBudget() {
    this.budgetService.setBudget(this.budgetCategory, this.budgetLimit);
    alert('Budget Saved');
  }
  addTransaction() {
    this.txService.addTransaction({
      amount: this.amount,
      type: this.type,
      category: this.category,
      description: this.description
    });

    this.amount = 0;
    this.category = '';
    this.description = '';
  }

  delete(id: string) {
    this.txService.deleteTransaction(id);
  }
}