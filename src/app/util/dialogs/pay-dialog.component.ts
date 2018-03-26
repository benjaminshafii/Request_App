import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './pay-dialog.component.html'
})
export class PayDialogComponent implements OnInit {
  request;
  payForm: FormGroup;
  amountFormControl: FormControl;
  allowForm: FormGroup;
  allowanceFormControl: FormControl;
  isAllowanceGranted: boolean;

  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder, private dialogRef: MatDialogRef < PayDialogComponent > , @Inject(MAT_DIALOG_DATA) private data: any) {
    this.request = data.request;
  }


  ngOnInit() {
    const allowanceGranted = this.isAllowanceGranted = false;
    const initialAmountValue = this.request.payee.expectedAmount.gt(this.request.payee.balance) ? this.web3Service.fromWei(this.request.payee.expectedAmount.sub(this.request.payee.balance).toString()) : '0';
    const amountValidator = [Validators.required, Validators.pattern('[0-9]*([\.][0-9]{0,18})?$')];

    this.amountFormControl = new FormControl(initialAmountValue, amountValidator);
    this.allowanceFormControl = new FormControl(initialAmountValue, amountValidator);
    this.payForm = this.formBuilder.group({
      amountFormControl: this.amountFormControl,
    });
    this.allowForm = this.formBuilder.group({
      allowanceFormControl: this.amountFormControl,
    });

    this.isAllowanceGranted = false;
  }

  callbackTx(response, msg ? ) {
    if (response.transaction) {
      this.web3Service.openSnackBar(msg || 'Transaction in progress.', 'Ok', 'info-snackbar');
    } else if (response.message) {
      if (response.message.startsWith('Invalid status 6985')) {
        this.web3Service.openSnackBar('Invalid status 6985. User denied transaction.');
      } else if (response.message.startsWith('Failed to subscribe to new newBlockHeaders')) {
        return;
      } else {
        console.error(response);
        this.web3Service.openSnackBar(response.message);
      }
    }
  }

  allow() {
    const { requestId, payer } = this.request;
    this.web3Service.allow(requestId, this.allowForm.value.allowanceFormControl, payer, this.callbackTx)
      .then((res) => this.isAllowanceGranted = true, (err) => console.error(err));
  }

  setMax() {
    this.amountFormControl.setValue(this.web3Service.fromWei(this.request.payee.expectedAmount.sub(this.request.payee.balance).toString()));
  }


  submit() {
    this.dialogRef.close(this.amountFormControl.value);
  }

}
