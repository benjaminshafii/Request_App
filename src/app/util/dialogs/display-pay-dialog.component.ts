import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './display-pay-dialog.component.html'
})
export class DisplayPayDialogComponent {
  requestObject: any;
  mode: string;
  btcAddress: string;

  constructor(
    public web3Service: Web3Service,
    private dialogRef: MatDialogRef<DisplayPayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.requestObject = data.requestObject;
    this.mode = data.mode;
    this.btcAddress =
      this.mode === 'pay'
        ? this.requestObject.requestData.currencyContract.payeePaymentAddress
        : this.requestObject.requestData.currencyContract.payeeRefundAddress;
  }
}
