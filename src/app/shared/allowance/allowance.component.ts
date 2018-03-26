import { Component, OnInit, Inject, Output, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { Web3Service } from '../../util/web3.service';

@Component({
  selector: 'app-allowance',
  templateUrl: './allowance.component.html',
  styleUrls: [],
})

export class AllowanceComponent implements OnInit {
  @Input() request: any;
  @Input() isRefund: false;
  @Output() onAllowed = new EventEmitter<boolean>();
  allowForm: FormGroup;
  allowanceFormControl: FormControl;


  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder) {}

  ngOnInit() {
    const initialAmountValue = this.request.payee.expectedAmount.gt(this.request.payee.balance) ? this.web3Service.fromWei(this.request.payee.expectedAmount.sub(this.request.payee.balance).toString()) : '0';
    const amountValidator = [Validators.required, Validators.pattern('[0-9]*([\.][0-9]{0,18})?$')];
    this.allowanceFormControl = new FormControl(initialAmountValue, amountValidator);
    this.allowForm = this.formBuilder.group({
      allowanceFormControl: this.allowanceFormControl,
    });

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

  submit() {
    const { requestId, payer, payee } = this.request;
    if (this.isRefund) {
      this.web3Service.allow(requestId, this.allowForm.value.allowanceFormControl, payee.address, this.callbackTx)
        .then((res) => this.onAllowed.emit(true), (err) => console.error(err));
    }
    this.web3Service.allow(requestId, this.allowForm.value.allowanceFormControl, payer, this.callbackTx)
      .then((res) => this.onAllowed.emit(true), (err) => console.error(err));

  }


}
