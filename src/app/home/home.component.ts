import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormBuilder, ValidationErrors } from '@angular/forms';
import { Web3Service } from '../util/web3.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  date: number = new Date().getTime();
  account: string;
  createLoading = false;

  requestForm: FormGroup;
  expectedAmountFormControl: FormControl;
  payeeFormControl: FormControl;
  payerFormControl: FormControl;
  reasonFormControl: FormControl;
  dateFormControl: FormControl;
  // currency = new FormControl('ETH');
  // currencies = [{ name: 'ether', iso: 'ETH' }];

  static sameAddressAsPayeeValidator(control: FormControl) {
    const result = control.value && control.root.get('payee').value === control.value ? { sameAddressAsPayee: true } : null;
    return result;
  }


  constructor(private web3Service: Web3Service, private formBuilder: FormBuilder, private router: Router) {}


  ngOnInit() {
    setInterval(_ => { this.date = new Date().getTime(); }, 5000);
    setTimeout(_ => this.web3Service.setSearchValue(''));


    this.expectedAmountFormControl = new FormControl('', [Validators.required, Validators.pattern('[0-9]*([\.][0-9]{0,18})?$')]);
    this.payerFormControl = new FormControl('', [Validators.required, Validators.pattern('^(0x)?[0-9a-fA-F]{40}$'), HomeComponent.sameAddressAsPayeeValidator]);
    this.payeeFormControl = new FormControl(this.account);
    this.dateFormControl = new FormControl('');
    this.reasonFormControl = new FormControl('');

    this.requestForm = this.formBuilder.group({
      expectedAmount: this.expectedAmountFormControl,
      payee: this.payeeFormControl,
      payer: this.payerFormControl,
      date: this.dateFormControl,
      Reason: this.reasonFormControl,
    });

    this.watchAccount();
  }


  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.account = account;
      this.payeeFormControl.setValue(this.account);
      this.payerFormControl.updateValueAndValidity();
    });
  }


  createRequest() {
    if (this.createLoading) { return; }

    this.createLoading = true;

    if (!this.requestForm.valid) {
      if (this.expectedAmountFormControl.hasError('required')) {
        this.expectedAmountFormControl.markAsTouched();
        this.expectedAmountFormControl.setErrors({ required: true });
      }
      if (this.payerFormControl.hasError('required')) {
        this.payerFormControl.markAsTouched();
        this.payerFormControl.setErrors({ required: true });
      }
      this.createLoading = false;
      return;
    }
    this.dateFormControl.setValue(this.date);

    const data = {};
    Object.keys(this.requestForm.value).forEach(key => {
      if (['expectedAmount', 'payer', 'payee'].findIndex(e => e === key) === -1 && this.requestForm.value[key] && this.requestForm.value[key] !== '') {
        data[key] = this.requestForm.value[key];
      }
    });

    const callback = response => {
      this.createLoading = false;
      this.web3Service.waitingForLedgerTxApproval = false;

      if (response.transaction) {
        this.web3Service.openSnackBar('The request is being created. Please wait a few moments for it to appear on the Blockchain.', 'Ok', 'info-snackbar');
        const queryParams = {
          expectedAmount: this.expectedAmountFormControl.value,
          payer: this.payerFormControl.value,
          payee: this.payeeFormControl.value,
        };
        Object.keys(data).forEach(key => queryParams[key] = data[key]);

        this.router.navigate(['/request/txHash', response.transaction.hash], { queryParams });
      } else if (response.message) {
        if (response.message.startsWith('Invalid status 6985')) {
          this.web3Service.openSnackBar('Invalid status 6985. User denied transaction.');
        } else if (response.message.startsWith('Failed to subscribe to new newBlockHeaders')) {
          return;
        } else {
          this.web3Service.openSnackBar(response.message);
        }
      }
    };

    this.web3Service.createRequestAsPayee(this.payerFormControl.value, this.expectedAmountFormControl.value, JSON.stringify(data), callback)
      .on('broadcasted', response => {
        console.log('callback createRequestAsPayee: ', response);
        callback(response);
      })
      .then(
        response => {
          console.log('resolve createRequestAsPayee: ', response);
          setTimeout(_ => { this.web3Service.openSnackBar('Request successfully created.', 'Ok', 'success-snackbar'); }, 5000);
        }, err => {
          console.error('Error:', err);
          callback(err);
        });
  }

}
