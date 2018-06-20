import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  ValidationErrors
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

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
  paymentAddressFormControl: FormControl;
  reasonFormControl: FormControl;
  dateFormControl: FormControl;
  currencyFormControl: FormControl;
  currencies: String[];

  sameAddressValidator(control: FormControl) {
    if (control.value) {
      if (
        control.root.get('payee').value &&
        control.root.get('payee').value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPayeeAddress: true };
      } else if (
        control.root.get('paymentAddress').value &&
        control.root.get('paymentAddress').value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPaymentAddress: true };
      }
    }
    return null;
  }

  isAddressValidator(control: FormControl) {
    if (
      this.web3Service.web3Ready &&
      control.value &&
      !this.web3Service.isAddress(control.value.toLowerCase())
    ) {
      return { invalidETHAddress: true };
    } else {
      return null;
    }
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

  constructor(
    private web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    setInterval(() => {
      this.date = new Date().getTime();
    }, 5000);
    this.web3Service.setSearchValue('');

    this.paymentAddressFormControl = new FormControl('', [
      Validators.required,
      this.isAddressValidator.bind(this)
    ]);
    this.expectedAmountFormControl = new FormControl('', [
      Validators.required,
      this.decimalValidator.bind(this)
      // Validators.pattern('[0-9]*([.][0-9]{0,18})?$')
    ]);
    this.payerFormControl = new FormControl('', [
      Validators.required,
      this.sameAddressValidator,
      this.isAddressValidator.bind(this)
    ]);
    this.payeeFormControl = new FormControl('');
    this.dateFormControl = new FormControl('');
    this.reasonFormControl = new FormControl('');
    this.currencyFormControl = new FormControl('ETH', [Validators.required]);

    this.requestForm = this.formBuilder.group({
      paymentAddress: this.paymentAddressFormControl,
      expectedAmount: this.expectedAmountFormControl,
      payee: this.payeeFormControl,
      payer: this.payerFormControl,
      currency: this.currencyFormControl,
      date: this.dateFormControl,
      reason: this.reasonFormControl
    });
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
      this.account = account;
      this.paymentAddressFormControl.setValue(this.account);
      this.payeeFormControl.setValue(this.account);
      this.payerFormControl.updateValueAndValidity();
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
        this.currencyFormControl.setValue(null);
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
      if (this.payerFormControl.hasError('required')) {
        this.payerFormControl.markAsTouched();
        this.payerFormControl.setErrors({ required: true });
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
          'payer',
          'paymentAddress',
          'payee',
          'currency'
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
        this.web3Service.openSnackBar(
          'The request is being created. Please wait a few moments for it to appear on the Blockchain.',
          'Ok',
          'info-snackbar'
        );
        const request = {
          payee: {
            address: this.payeeFormControl.value,
            balance: this.expectedAmountFormControl.value,
            expectedAmount: this.expectedAmountFormControl.value
          },
          currencyContract: {
            payeePaymentAddress:
              this.paymentAddressFormControl.value &&
              this.paymentAddressFormControl.value !== this.account
                ? this.paymentAddressFormControl.value
                : null
          },
          currency: this.currencyFormControl.value,
          payer: this.payerFormControl.value,
          data: { data: {} }
        };

        for (const key of Object.keys(data)) {
          request.data.data[key] = data[key];
        }
        return this.router.navigate(
          ['/request/txHash', response.transaction.hash],
          {
            queryParams: { request: btoa(JSON.stringify(request)) }
          }
        );
      } else if (response.message) {
        if (response.message.includes('6985')) {
          return this.web3Service.openSnackBar(
            'Invalid status 6985. User denied transaction.'
          );
        } else if (response.message.includes('newBlockHeaders')) {
          return;
        } else if (
          response.message.startsWith(
            'Returned error: Error: MetaMask Tx Signature'
          )
        ) {
          return this.web3Service.openSnackBar(
            'MetaMask Tx Signature: User denied transaction signature.'
          );
        } else {
          console.error(response);
          return this.web3Service.openSnackBar(response.message);
        }
      }
    };

    this.web3Service
      .createRequestAsPayee(
        this.payerFormControl.value,
        this.expectedAmountFormControl.value,
        this.currencyFormControl.value,
        this.paymentAddressFormControl.value,
        { data }
      )
      .on('broadcasted', response => {
        callback(response);
      })
      // .then(
      //   response => {
      //     // setTimeout(() => { this.web3Service.openSnackBar('Request successfully created.', 'Ok', 'success-snackbar'); }, 5000);
      //   },
      //   err => {}
      // )
      .catch(err => {
        callback(err);
      });
  }
}
