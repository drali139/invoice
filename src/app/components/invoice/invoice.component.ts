import { Component, Input, Output, EventEmitter, inject, WritableSignal, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonNote, IonItemGroup, IonItemDivider, IonIcon } from '@ionic/angular/standalone';

import jsPDF from 'jspdf';
import { OrderItem } from 'src/app/core/interfaces/orderitem.interface';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonModal, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput,
    IonTextarea, IonSelect, IonSelectOption, IonNote, IonItemGroup,
    IonItemDivider, IonIcon]
})
export class InvoiceComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<boolean>();

  private fb: FormBuilder = inject(FormBuilder);
  
  public logoUrl: WritableSignal<string | null> = signal<string | null>(null);
  public totalAmount: WritableSignal<number> = signal<number>(0);
  public isPdfGenerated: WritableSignal<boolean> = signal<boolean>(false);
  public pdfDoc: WritableSignal<jsPDF | null> = signal<jsPDF | null>(null);

  public invoiceForm = this.fb.group({
    customerName: ['', Validators.required],
    customerAddress: ['', Validators.required],
    orderItems: this.fb.array<FormGroup>([]),
    discount: ['0'],
    paymentMethod: ['cash', Validators.required]
  });

  public get orderItems(): FormArray {
    return this.invoiceForm.get('orderItems') as FormArray;
  }

  public addOrderItem(): void {
    const orderItem = this.fb.group({
      product: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.orderItems.push(orderItem);
    this.calculateTotal();
  }

  public calculateItemTotal(item: OrderItem): number {
    return item.price * item.quantity;
  }

  public calculateTotal(): void {
    let subtotal = 0;
    this.orderItems.controls.forEach(item => {
      subtotal += this.calculateItemTotal(item.value);
    });

    const discountPercentage = Number(this.invoiceForm.get('discount')?.value) || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const finalAmount = subtotal - discountAmount;

    this.totalAmount.set(finalAmount);
  }

  public uploadLogo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.logoUrl.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  public preparePDF(): void {
    const doc = new jsPDF();

    const currentLogoUrl = this.logoUrl();
    if (currentLogoUrl) {
      doc.addImage(currentLogoUrl, 'JPEG', 10, 10, 35, 35);
    }

    doc.text('INVOICE', 85, 15);
    doc.text(`Customer: ${this.invoiceForm.get('customerName')?.value}`, 10, 50);
    doc.text(`Address: ${this.invoiceForm.get('customerAddress')?.value}`, 10, 60);

    let y = 80;
    doc.text('Product', 10, y);
    doc.text('Price', 60, y);
    doc.text('Qty', 90, y);
    doc.text('Amount', 120, y);

    this.orderItems.controls.forEach((item, index) => {
      y += 10;
      const values = item.value;
      doc.text(values.product, 10, y);
      doc.text(values.price.toString(), 60, y);
      doc.text(values.quantity.toString(), 90, y);
      doc.text(this.calculateItemTotal(values).toString(), 120, y);
    });

    y += 20;
    doc.text(`Discount: ${this.invoiceForm.get('discount')?.value}%`, 10, y);
    y += 10;
    doc.text(`Total Amount: ${this.totalAmount()}`, 10, y);
    y += 10;
    doc.text(`Payment Method: ${this.invoiceForm.get('paymentMethod')?.value}`, 10, y);

    this.pdfDoc.set(doc);
    this.isPdfGenerated.set(true);
  }

  public viewPDF(): void {
    if (this.pdfDoc()) {
      this.pdfDoc()?.output('dataurlnewwindow');
    }
  }

  public downloadPDF(): void {
    if (this.pdfDoc()) {
      this.pdfDoc()?.save('invoice.pdf');
      this.resetForm();
      this.close();
    }
  }

  private resetForm(): void {
    this.invoiceForm.reset({
      customerName: '',
      customerAddress: '',
      discount: '0',
      paymentMethod: 'cash'
    });
    while (this.orderItems.length) {
      this.orderItems.removeAt(0);
    }
    this.logoUrl.set(null);
    this.totalAmount.set(0);
    this.isPdfGenerated.set(false);
    this.pdfDoc.set(null);
  }

  public close(): void {
    this.closeModal.emit(false);
  }
}
