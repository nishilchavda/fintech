import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  setBudget(category: string, limit: number) {
    const ref = collection(this.firestore, 'budgets');
    return addDoc(ref, {
      category,
      limit,
      userId: this.auth.currentUser?.uid
    });
  }

  getBudgets() {
    const ref = collection(this.firestore, 'budgets');
    const q = query(ref, where('userId', '==', this.auth.currentUser?.uid));
    return collectionData(q, { idField: 'id' });
  }
}