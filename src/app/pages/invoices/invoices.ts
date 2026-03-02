import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../services/invoice.service';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-invoices',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, DecimalPipe, FormsModule],
    templateUrl: './invoices.html',
    styleUrl: './invoices.css'
})
export class Invoices implements OnInit {

    invoices: any[] = [];
    filteredInvoices: any[] = [];
    showForm = false;
    editingInvoice: any = null;
    successMessage = '';

    filterTabs = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];
    activeFilter = 'All';

    totalAmount = 0;
    paidAmount = 0;
    outstandingAmount = 0;
    paidCount = 0;
    overdueCount = 0;

    formData: {
        clientName: string;
        clientEmail: string;
        dueDate: string;
        status: string;
        items: { description: string; quantity: number; rate: number }[];
    } = {
            clientName: '',
            clientEmail: '',
            dueDate: '',
            status: 'draft',
            items: [{ description: '', quantity: 1, rate: 0 }]
        };

    constructor(private invoiceService: InvoiceService) { }

    ngOnInit() {
        this.invoiceService.getInvoices().subscribe((data: any[]) => {
            this.invoices = data;
            this.calculateStats();
            this.filterInvoices();
        });
    }

    calculateStats() {
        this.totalAmount = this.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        this.paidAmount = this.invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        this.outstandingAmount = this.invoices
            .filter(inv => inv.status !== 'paid')
            .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        this.paidCount = this.invoices.filter(inv => inv.status === 'paid').length;
        this.overdueCount = this.invoices.filter(inv => inv.status === 'overdue').length;
    }

    filterInvoices() {
        if (this.activeFilter === 'All') {
            this.filteredInvoices = this.invoices;
        } else {
            this.filteredInvoices = this.invoices.filter(
                inv => inv.status === this.activeFilter.toLowerCase()
            );
        }
    }

    getFormTotal(): number {
        return this.formData.items.reduce(
            (sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0
        );
    }

    addLineItem() {
        this.formData.items.push({ description: '', quantity: 1, rate: 0 });
    }

    removeLineItem(index: number) {
        this.formData.items.splice(index, 1);
    }

    openForm() {
        if (this.showForm) {
            this.resetForm();
        } else {
            this.showForm = true;
        }
    }

    saveInvoice() {
        if (!this.formData.clientName || this.formData.items.length === 0) return;

        const invoiceData = {
            clientName: this.formData.clientName,
            clientEmail: this.formData.clientEmail,
            dueDate: this.formData.dueDate,
            status: this.formData.status,
            items: this.formData.items.filter(item => item.description && item.rate > 0),
            totalAmount: this.getFormTotal()
        };

        if (this.editingInvoice) {
            this.invoiceService.updateInvoice(this.editingInvoice.id, invoiceData).then(() => {
                this.showSuccess('Invoice updated successfully!');
            });
        } else {
            this.invoiceService.addInvoice(invoiceData).then(() => {
                this.showSuccess('Invoice created successfully!');
            });
        }

        this.resetForm();
    }

    editInvoice(inv: any) {
        this.editingInvoice = inv;
        this.formData = {
            clientName: inv.clientName,
            clientEmail: inv.clientEmail || '',
            dueDate: inv.dueDate || '',
            status: inv.status || 'draft',
            items: inv.items && inv.items.length > 0
                ? [...inv.items]
                : [{ description: '', quantity: 1, rate: 0 }]
        };
        this.showForm = true;
    }

    markAsPaid(inv: any) {
        this.invoiceService.updateInvoice(inv.id, { status: 'paid' }).then(() => {
            this.showSuccess('Invoice marked as paid!');
        });
    }

    deleteInvoice(id: string) {
        this.invoiceService.deleteInvoice(id).then(() => {
            this.showSuccess('Invoice deleted.');
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'paid': return '#22c55e';
            case 'sent': return '#3b82f6';
            case 'overdue': return '#ef4444';
            default: return '#64748b';
        }
    }

    getInvoiceNumber(inv: any): string {
        const idx = this.invoices.indexOf(inv);
        return `INV-${String(idx + 1).padStart(4, '0')}`;
    }

    resetForm() {
        this.formData = {
            clientName: '',
            clientEmail: '',
            dueDate: '',
            status: 'draft',
            items: [{ description: '', quantity: 1, rate: 0 }]
        };
        this.editingInvoice = null;
        this.showForm = false;
    }

    private showSuccess(message: string) {
        this.successMessage = message;
        setTimeout(() => {
            this.successMessage = '';
        }, 3000);
    }
}
