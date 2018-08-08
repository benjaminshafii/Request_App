import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  ValidationErrors,
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';
import * as WAValidator from 'wallet-address-validator';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  date: number = new Date().getTime();
  account: string;
  createLoading = false;
  requestForm: FormGroup;
  expectedAmountFormControl: FormControl;
  payeeIdAddressFormControl: FormControl;
  payeePaymentAddressFormControl: FormControl;
  payerAddressFormControl: FormControl;
  payerRefundAddressFormControl: FormControl;
  reasonFormControl: FormControl;
  dateFormControl: FormControl;
  currencyFormControl: FormControl;
  currencies: String[];
  BTCRefundAddress;

  isAddressValidator(curr?: string) {
    return (control: FormControl) => {
      if (control.value) {
        const currency = curr
          ? curr
          : this.currencyFormControl.value === 'BTC'
            ? 'BTC'
            : 'ETH';
        if (
          (currency === 'ETH' &&
            this.web3Service.web3Ready &&
            !this.web3Service.isAddress(control.value.toLowerCase())) ||
          (currency !== 'ETH' &&
            !WAValidator.validate(
              control.value,
              currency,
              this.web3Service.networkIdObservable.value !== 1 ? 'testnet' : ''
            ))
        ) {
          return { invalidAddress: true };
        }
      }
      return null;
    };
  }

  decimalValidator(control: FormControl) {
    if (this.web3Service.web3Ready && control.value) {
      const decimal = this.web3Service.getDecimalsForCurrency(
        this.currencyFormControl.value
      );
      const regexp = new RegExp(`^[0-9]*([.][0-9]{0,${decimal}})?$`);
      if (!regexp.test(control.value)) {
        return { pattern: true };
      }
    }
    return null;
  }

  sameAddressValidator(control: FormControl) {
    if (control.value) {
      if (
        this.payeeIdAddressFormControl.value &&
        this.payeeIdAddressFormControl.value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPayeeAddress: true };
      } else if (
        this.payeePaymentAddressFormControl.value &&
        this.payeePaymentAddressFormControl.value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPaymentAddress: true };
      }
    }
    return null;
  }

  constructor(
    private web3Service: Web3Service,
    private utilService: UtilService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    setInterval(() => {
      this.date = new Date().getTime();
    }, 5000);
    this.utilService.setSearchValue('');

    this.currencyFormControl = new FormControl('ETH', [Validators.required]);
    this.payeeIdAddressFormControl = new FormControl('', [Validators.required]);
    this.payeePaymentAddressFormControl = new FormControl('', [
      Validators.required,
      this.isAddressValidator().bind(this),
    ]);
    this.expectedAmountFormControl = new FormControl('', [
      Validators.required,
      this.decimalValidator.bind(this),
    ]);
    this.payerAddressFormControl = new FormControl('', [
      Validators.required,
      this.sameAddressValidator.bind(this),
      this.isAddressValidator('ETH').bind(this),
    ]);
    this.payerRefundAddressFormControl = new FormControl('', [
      this.isAddressValidator().bind(this),
      this.sameAddressValidator.bind(this),
    ]);
    this.dateFormControl = new FormControl('');
    this.reasonFormControl = new FormControl('');

    this.payeePaymentAddressFormControl.valueChanges.subscribe(() =>
      this.payerAddressFormControl.updateValueAndValidity()
    );

    this.requestForm = this.formBuilder.group({
      currency: this.currencyFormControl,
      payeePaymentAddress: this.payeePaymentAddressFormControl,
      payeeIdAddress: this.payeeIdAddressFormControl,
      expectedAmount: this.expectedAmountFormControl,
      payerAddress: this.payerAddressFormControl,
      payerRefundAddress: this.payerRefundAddressFormControl,
      date: this.dateFormControl,
      reason: this.reasonFormControl,
    });
  }

  onCurrencyChange(event) {
    this.payerRefundAddressFormControl.setValue('');
    this.payerRefundAddressFormControl.updateValueAndValidity();
    this.payeePaymentAddressFormControl.markAsTouched();
    this.payeePaymentAddressFormControl.updateValueAndValidity();
  }

  getBlockchainSymbol() {
    return this.currencyFormControl.value === 'BTC' ? 'BTC' : 'ETH';
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
    this.watchAccount();
    this.watchNetworkId();
  }

  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.payeePaymentAddressFormControl.setValue(account);
      this.account = account;
      this.payeeIdAddressFormControl.setValue(this.account);
      this.payerAddressFormControl.updateValueAndValidity();
    });
  }

  watchNetworkId() {
    this.web3Service.networkIdObservable.subscribe(networkId => {
      switch (networkId) {
        case 1:
          this.currencies = ['ETH', 'REQ', 'KNC', 'DGX', 'DAI', 'OMG'];
          break;
        default:
          this.currencies = ['ETH'];
          break;
      }
      if (!this.currencies.includes(this.currencyFormControl.value)) {
        this.currencyFormControl.setValue('ETH');
      }
    });
  }

  createRequest() {
    if (this.createLoading || this.web3Service.watchDog()) {
      return;
    }
    this.createLoading = true;

    if (!this.requestForm.valid) {
      if (this.expectedAmountFormControl.hasError('required')) {
        this.expectedAmountFormControl.markAsTouched();
        this.expectedAmountFormControl.setErrors({ required: true });
      }
      if (this.payerAddressFormControl.hasError('required')) {
        this.payerAddressFormControl.markAsTouched();
        this.payerAddressFormControl.setErrors({ required: true });
      }
      this.createLoading = false;
      return;
    }
    this.dateFormControl.setValue(this.date);

    const data = {};
    for (const [key, value] of Object.entries(this.requestForm.value)) {
      if (
        ![
          'expectedAmount',
          'payerAddress',
          'payeePaymentAddress',
          'payeeIdAddress',
          'payerRefundAddress',
          'currency',
        ].includes(key) &&
        value &&
        value !== ''
      ) {
        data[key] = value;
      }
    }

    const callback = response => {
      this.createLoading = false;

      if (response.transaction) {
        this.utilService.openSnackBar(
          'The request is being created. Please wait a few moments for it to appear on the Blockchain.',
          'Ok',
          'info-snackbar'
        );
        const request = {
          payee: {
            address: this.payeeIdAddressFormControl.value,
            balance: this.expectedAmountFormControl.value,
            expectedAmount: this.expectedAmountFormControl.value,
          },
          currencyContract: {
            payeePaymentAddress:
              this.payeePaymentAddressFormControl.value &&
              this.payeePaymentAddressFormControl.value !== this.account
                ? this.payeePaymentAddressFormControl.value
                : null,
          },
          currency: this.currencyFormControl.value,
          payer: this.payerAddressFormControl.value,
          data: { data: {} },
        };

        for (const key of Object.keys(data)) {
          request.data.data[key] = data[key];
        }
        return this.router.navigate(
          ['/request/txHash', response.transaction.hash],
          {
            queryParams: { request: btoa(JSON.stringify(request)) },
          }
        );
      } else if (response.message) {
        if (response.message.includes('6985')) {
          return this.utilService.openSnackBar(
            'Invalid status 6985. User denied transaction.'
          );
        } else if (response.message.includes('newBlockHeaders')) {
          return;
        } else if (
          response.message.startsWith(
            'Returned error: Error: MetaMask Tx Signature'
          )
        ) {
          return this.utilService.openSnackBar(
            'MetaMask Tx Signature: User denied transaction signature.'
          );
        } else {
          console.error(response);
          return this.utilService.openSnackBar(response.message);
        }
      }
    };

    this.web3Service
      .createRequest(
        'Payee',
        this.payerAddressFormControl.value,
        this.expectedAmountFormControl.value,
        this.currencyFormControl.value,
        this.payeePaymentAddressFormControl.value,
        { data },
        this.payerRefundAddressFormControl.value
      )
      .on('broadcasted', response => {
        callback(response);
      })
      .catch(err => {
        callback(err);
      });
  }
}
