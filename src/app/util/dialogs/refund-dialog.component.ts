import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './refund-dialog.component.html'
})
export class RefundDialogComponent implements OnInit {
  request;
  refundForm: FormGroup;
  refundFormControl: FormControl;
  isAllowanceGranted: boolean;
  allowance: string;
  amountValidator: [any];

  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder, private dialogRef: MatDialogRef < RefundDialogComponent > , @Inject(MAT_DIALOG_DATA) private data: any) {
    this.request = data.request;
  }

  ngOnInit() {
    this.amountValidator = [Validators.required, Validators.pattern('[0-9]*([\.][0-9]{0,18})?$')];
    this.refundFormControl = new FormControl('', this.amountValidator);
    this.refundForm = this.formBuilder.group({
      refundFormControl: this.refundFormControl,
    });
    this.isAllowanceGranted = false;
  }


  setMax() {
    this.refundFormControl.setValue(this.web3Service.fromWei(this.request.balance));
  }


  submit() {
    this.dialogRef.close(this.refundFormControl.value);
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


    this.refundForm.controls['refundFormControl'].setValidators([...this.amountValidator, Validators.max(allowanceInt)]);
    this.refundForm.controls['refundFormControl'].updateValueAndValidity();
    return this.refundFormControl.setValue(this.web3Service.fromWei(allowanceAmount));
  }

}
