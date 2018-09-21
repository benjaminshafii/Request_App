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

  public invoiceItemsColumns = [
    'name',
    'quantity',
    'unitPrice',
    'discount',
    'taxPercent',
    'amount',
  ];

  data: any;
  taxFreeTotal;
  vatTotal;
  totalWithTax;

  constructor(public web3Service: Web3Service) {}

  ngOnInit() {
    this.data = this.request.data.data;
    this.updateTotals();
  }

  getTaxFreeTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .BN(item.unitPrice)
            .sub(this.web3Service.BN(item.discount || 0))
            .mul(this.web3Service.BN(item.quantity))
        ),
      this.web3Service.BN()
    );
  }

  getVatTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .BN(item.unitPrice)
            .sub(this.web3Service.BN(item.discount || 0))
            .mul(this.web3Service.BN(item.quantity))
            .mul(this.web3Service.BN(Math.round(item.taxPercent * 100)))
            .div(this.web3Service.BN(10000))
        ),
      this.web3Service.BN()
    );
  }

  updateTotals() {
    if (!this.data['invoiceItems'] || !this.web3Service.web3Ready) {
      this.taxFreeTotal = null;
      this.vatTotal = null;
      this.totalWithTax = null;
    }
    if (this.data['meta']['version'] === '0.0.1') {
      this.updateTotalsV001();
      return;
    }
    this.taxFreeTotal = this.getTaxFreeTotal();
    this.vatTotal = this.getVatTotal();
    this.totalWithTax = this.taxFreeTotal.add(this.vatTotal);
  }

  itemAmount(unitPrice, discount, quantity) {
    if (!this.web3Service.web3Ready) {
      return '0';
    }
    if (this.data['meta']['version'] === '0.0.1') {
      return this.web3Service.BNToAmount(
        this.web3Service
          .amountToBN(unitPrice.toString(), this.request.currency)
          .sub(
            this.web3Service.amountToBN(
              discount ? discount.toString() : '0',
              this.request.currency
            )
          )
          .mul(this.web3Service.BN(quantity)),
        this.request.currency
      );
    }

    return this.web3Service.BNToAmount(
      this.web3Service
        .BN(unitPrice)
        .sub(this.web3Service.BN(discount || 0))
        .mul(this.web3Service.BN(quantity)),
      this.request.currency
    );
  }

  updateTotalsV001() {
    this.taxFreeTotal = this.web3Service.amountToBN(
      this.data['invoiceItems']
        .reduce(
          (acc, item) =>
            acc + item.quantity * (item.unitPrice - (item.discount || 0)),
          0
        )
        .toString(),
      this.request.currency
    );
    this.vatTotal = this.web3Service.amountToBN(
      this.data['invoiceItems']
        .reduce(
          (acc, item) =>
            acc +
            item.quantity *
              (item.unitPrice - (item.discount || 0)) *
              (item.taxPercent * 0.01),
          0
        )
        .toString(),
      this.request.currency
    );
    this.totalWithTax = this.taxFreeTotal.add(this.vatTotal);
  }
}
