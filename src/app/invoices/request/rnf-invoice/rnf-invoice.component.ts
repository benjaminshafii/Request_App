import { Component, OnInit, Input } from '@angular/core';
import { Web3Service } from '../../../util/web3.service';
import { IRequestData } from '@requestnetwork/request-network.js';

@Component({
  selector: 'app-rnf-invoice-request',
  templateUrl: './rnf-invoice.component.html',
  styleUrls: ['./rnf-invoice.component.scss'],
})
export class RnfInvoiceComponent implements OnInit {
  @Input()
  request: IRequestData;

  @Input()
  blockchainName: string;

  private invoiceItemsColumns = [
    'name',
    'quantity',
    'unitPrice',
    'discount',
    'taxPercent',
    'amount',
  ];

  data: object;
  taxFreeTotal: number;
  vatTotal: number;
  totalWithTax: number;

  constructor(private web3Service: Web3Service) {}

  ngOnInit() {
    this.data = this.request.data.data;
    this.updateTotals();
    console.log(this.data);
  }

  getTaxFreeTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc + item.quantity * (item.unitPrice - (item.discount || 0)),
      0
    );
  }

  getVatTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc +
        item.quantity *
          (item.unitPrice - (item.discount || 0)) *
          (item.taxPercent * 0.01),
      0
    );
  }

  updateTotals() {
    this.taxFreeTotal = this.getTaxFreeTotal();
    this.vatTotal = this.getVatTotal();
    this.totalWithTax = this.taxFreeTotal + this.vatTotal;
  }
}
