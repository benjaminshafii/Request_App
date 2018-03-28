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
  isAllowanceGranted: boolean;
  allowance: string;
  amountValidator: [any];

  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder, private dialogRef: MatDialogRef < PayDialogComponent > , @Inject(MAT_DIALOG_DATA) private data: any) {
    this.request = data.request;
  }


  ngOnInit() {
    const initialAmountValue = this.request.payee.expectedAmount.gt(this.request.payee.balance) ? this.web3Service.fromWei(this.request.payee.expectedAmount.sub(this.request.payee.balance).toString()) : '0';
    this.amountValidator = [Validators.required, Validators.pattern('[0-9]*([\.][0-9]{0,18})?$')];

    this.amountFormControl = new FormControl(initialAmountValue, this.amountValidator);
    this.payForm = this.formBuilder.group({
      amountFormControl: this.amountFormControl,
    });

    this.isAllowanceGranted = false;
  }


  setMax() {
    this.amountFormControl.setValue(this.web3Service.fromWei(this.request.payee.expectedAmount.sub(this.request.payee.balance).toString()));
  }


  submit() {
    this.dialogRef.close(this.amountFormControl.value);
  }

  onAllowed(allowed: boolean) {
    this.isAllowanceGranted = allowed;
  }

  onSetAllowance(allowance: string) {
    this.allowance = allowance;
    // needed to use Validators.max()
    const allowanceInt = parseInt(this.web3Service.fromWei(allowance), 10);

    const remainingAmount = this.request.payee.expectedAmount.sub(this.request.payee.balance);
    const allowanceAmount = this.web3Service.BN(allowance);


    this.payForm.controls['amountFormControl'].setValidators([...this.amountValidator, Validators.max(allowanceInt)]);
    this.payForm.controls['amountFormControl'].updateValueAndValidity();
    if (remainingAmount.gt(allowanceAmount)) {
      return this.amountFormControl.setValue(this.web3Service.fromWei(allowanceAmount));
    }

    return this.amountFormControl.setValue(this.web3Service.fromWei(remainingAmount));
  }
}
