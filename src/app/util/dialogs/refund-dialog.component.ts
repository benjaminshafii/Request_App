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
  templateUrl: './refund-dialog.component.html'
})
export class RefundDialogComponent implements OnInit {
  requestObject: any;
  request: any;
  refundForm: FormGroup;
  refundFormControl: FormControl;
  loading: boolean;
  allowanceMode: boolean;
  isAllowanceGranted: boolean;
  callbackTx: any;
  waitAllowance: boolean;

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<RefundDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.callbackTx = data.callbackTx;
    this.requestObject = data.requestObject;
    this.request = data.requestObject.requestData;
    this.loading = false;
    this.isAllowanceGranted = false;
    this.waitAllowance = false;

    this.allowanceMode =
      this.request.currency !== 'ETH' && this.request.currency !== 'BTC'
        ? true
        : false;
  }

  ngOnInit() {
    this.refundFormControl = new FormControl('', [
      Validators.required,
      Validators.pattern('[0-9]*([.][0-9]{0,18})?$')
    ]);
    this.refundForm = this.formBuilder.group({
      refundFormControl: this.refundFormControl
    });
  }

  setMax() {
    this.refundFormControl.setValue(
      this.web3Service.fromWei(
        this.request.payee.balance.isNeg() ? 0 : this.request.payee.balance
      )
    );
  }

  submitAllowance() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .allow(this.request.requestId, this.refundFormControl.value)
      .on('broadcasted', txHash => {
        this.loading = false;
        this.isAllowanceGranted = true;
        this.waitAllowance = true;
        setTimeout(() => {
          this.waitAllowance = false;
        }, 30000);
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }

  submitRefund() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .refund(this.requestObject, this.refundFormControl.value, {
        skipERC20checkAllowance: true
      })
      .on('broadcasted', response => {
        this.callbackTx(
          response,
          'Refund in progress. Please wait a few moments for it to appear on the Blockchain.'
        );
        this.dialogRef.close();
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }
}
