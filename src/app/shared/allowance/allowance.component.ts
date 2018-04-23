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
  @Input() allow: any;
  @Output() onAllowed = new EventEmitter<boolean>();
  @Output() onSetAllowance = new EventEmitter<boolean>();
  loading: boolean;
  allowForm: FormGroup;
  allowanceFormControl: FormControl;


  constructor(public web3Service: Web3Service, private formBuilder: FormBuilder) {
    this.loading = true;
  }

  ngOnInit() {
    const { payee, currencyContract, payer } = this.request;

    const initialAmountValue = payee.expectedAmount.gt(payee.balance) ? this.web3Service.fromWei(payee.expectedAmount.sub(payee.balance).toString()) : '0';

    this.web3Service.getAllowance(currencyContract.tokenAddress, currencyContract.address, payer)
      .then((allowance) => {
        this.loading = false;
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



  setAllowance = (address) => (
    this.allow(this.allowForm.value.allowanceFormControl, address)
    .on('broadcasted', () => {
      this.loading = false;
      this.onAllowed.emit(true);
      this.onSetAllowance.emit(this.web3Service.toWei(this.allowForm.value.allowanceFormControl));
    })
    .then(() => {
      this.onAllowed.emit(true);
      this.onSetAllowance.emit(this.web3Service.toWei(this.allowForm.value.allowanceFormControl));
    }, (err) => console.error(err))
  )

  submit() {
    this.loading = true;
    const { requestId, payer, payee } = this.request;
    if (this.isRefund) {
      return this.setAllowance(payee.address);
    }
    return this.setAllowance(payer);
  }
}
