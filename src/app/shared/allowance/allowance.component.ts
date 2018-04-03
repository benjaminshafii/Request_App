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
  @Output() onSetAllowance = new EventEmitter<boolean>();
  allowForm: FormGroup;
  allowanceFormControl: FormControl;


  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder) {}

  ngOnInit() {
    const { payee, currencyContract, payer } = this.request;

    const initialAmountValue = payee.expectedAmount.gt(payee.balance) ? this.web3Service.fromWei(payee.expectedAmount.sub(payee.balance).toString()) : '0';

    this.web3Service.getAllowance(currencyContract.tokenAddress, currencyContract.address, payer)
      .then((allowance) => {
        const isAllowanceGreater = this.web3Service.BN(allowance).gte(payee.expectedAmount.sub(payee.balance)) && !this.web3Service.BN(allowance).isZero();
        if (!this.isRefund) {
          this.onAllowed.emit(isAllowanceGreater);
          this.onSetAllowance.emit(allowance);
        }
      });


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

  setAllowance = (requestId, address) => (
    this.web3Service.allow(requestId, this.allowForm.value.allowanceFormControl, address, this.callbackTx)
    .on('broadcasted', () => {
      this.onAllowed.emit(true);
      this.onSetAllowance.emit(this.web3Service.toWei(this.allowForm.value.allowanceFormControl));
    })
    .then(() => {
      this.onAllowed.emit(true);
      this.onSetAllowance.emit(this.web3Service.toWei(this.allowForm.value.allowanceFormControl));
    }, (err) => console.error(err))
  )

  submit() {
    const { requestId, payer, payee } = this.request;
    if (this.isRefund) {
      return this.setAllowance(requestId, payee.address);
    }
    return this.setAllowance(requestId, payer);
  }
}
