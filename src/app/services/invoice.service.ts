import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

    constructor(private firestore: Firestore, private auth: Auth) { }

    addInvoice(data: any) {
        const ref = collection(this.firestore, 'invoices');
        return addDoc(ref, {
            ...data,
            userId: this.auth.currentUser?.uid,
            createdAt: new Date()
        });
    }

    getInvoices() {
        const ref = collection(this.firestore, 'invoices');
        const q = query(ref, where('userId', '==', this.auth.currentUser?.uid));
        return collectionData(q, { idField: 'id' });
    }

    updateInvoice(id: string, data: any) {
        const ref = doc(this.firestore, `invoices/${id}`);
        return updateDoc(ref, data);
    }

    deleteInvoice(id: string) {
        const ref = doc(this.firestore, `invoices/${id}`);
        return deleteDoc(ref);
    }
}
