import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { InvoiceComponent } from '../components/invoice/invoice.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [IonContent,IonHeader,IonToolbar,IonTitle,IonButton,InvoiceComponent]
})
export class HomePage {
  isModalOpen = false;

  handleModalClose() {
    this.isModalOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }
}