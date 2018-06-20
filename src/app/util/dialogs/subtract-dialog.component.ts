import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './subtract-dialog.component.html'
})
export class SubtractDialogComponent implements OnInit {
  requestObject: any;
  request: any;
  subtractForm: FormGroup;
  subtractAmountFormControl: FormControl;
  superiorToExpectedAmountValidator;
  loading: boolean;
  callbackTx: any;

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SubtractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.requestObject = data.requestObject;
    this.request = data.requestObject.requestData;
    this.callbackTx = data.callbackTx;
    this.loading = false;
  }

  ngOnInit() {
    this.superiorToExpectedAmountValidator = (control: FormControl) => {
      if (!control.value) {
        return null;
      }
      control.markAsTouched();
      try {
        const controlBN = this.web3Service.BN(
          this.web3Service.toWei(control.value.toString())
        );
        return !isNaN(control.value) &&
          this.request.payee.expectedAmount.lte(controlBN)
          ? { superiorNumber: true }
          : null;
      } catch (err) {
        return { pattern: true };
      }
    };

    this.subtractAmountFormControl = new FormControl('', [
      Validators.required,
      Validators.pattern('[0-9]*([.][0-9]{0,18})?$'),
      this.superiorToExpectedAmountValidator
    ]);

    this.subtractForm = this.formBuilder.group({
      subtractAmountFormControl: this.subtractAmountFormControl
    });
  }

  submit() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .subtract(this.requestObject, this.subtractAmountFormControl.value)
      .on('broadcasted', response => {
        this.callbackTx(
          response,
          'Subtract in progress. Please wait a few moments for it to appear on the Blockchain.'
        );
        this.dialogRef.close();
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }
}
