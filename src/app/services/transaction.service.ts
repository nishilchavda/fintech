import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, deleteDoc, doc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { query, where } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class TransactionService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  addTransaction(data: any) {
    const user = this.auth.currentUser;

    const ref = collection(this.firestore, 'transactions');

    return addDoc(ref, {
      ...data,
      userId: user?.uid,
      createdAt: new Date()
    });
  }

  getTransactions() {
    const user = this.auth.currentUser;

    const ref = collection(this.firestore, 'transactions');
    const q = query(ref, where('userId', '==', user?.uid));

    return collectionData(q, { idField: 'id' });
  }

  deleteTransaction(id: string) {
    const ref = doc(this.firestore, `transactions/${id}`);
    return deleteDoc(ref);
  }
}