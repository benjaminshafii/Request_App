import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  ValidationErrors,
  FormArray,
  ValidatorFn,
} from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import * as moment from 'moment';
import RequestNetworkDataFormat from 'requestnetwork-data-format';
import rnf_invoice from 'requestnetwork-data-format/format/rnf_invoice/rnf_invoice-0.0.1.json';
import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-advanced-invoice',
  templateUrl: './advanced-invoice.component.html',
  styleUrls: ['./advanced-invoice.component.scss'],
  animations: [
    trigger('displayAnim', [
      transition(':enter', [
        style({
          overflow: 'hidden',
          'min-height': 52,
          'max-height': 0,
          opacity: 0,
          transform: 'scale(0.5)',
        }),
        animate(
          '0.7s cubic-bezier(.8, -0.6, 0.26, 1.6)',
          style({
            overflow: 'visible',
            'max-height': 1000,
            opacity: 1,
            transform: 'scale(1)',
          })
        ),
      ]),
    ]),
  ],
})
export class AdvancedInvoiceComponent implements OnInit {
  @ViewChild('itemsTable')
  itemsTable;

  private currency = new FormControl('');
  private deliveryDate = new FormControl('');
  private payeeETHAddress = new FormControl('');
  private payerETHAddress = new FormControl('');

  private form: FormGroup;
  private invoiceData: FormGroup;

  private creationDate = new FormControl('', Validators.required);
  private invoiceNumber = new FormControl('', Validators.required);
  private note = new FormControl('');
  private purchaseOrderId = new FormControl('');
  private terms = new FormControl('');

  private sellerInfo = this.formBuilder.group({
    businessName: [null],
    address: this.formBuilder.group({
      streetAddress: [null],
      extendedAddress: [null],
      locality: [null],
      postalCode: [null],
      region: [null],
      country: [null],
    }),
    companyRegistration: [null],
    taxRegistration: [null],
  });

  private buyerInfo = this.formBuilder.group({
    firstName: [null],
    lastName: [null],
    businessName: [null],
    address: this.formBuilder.group({
      streetAddress: [null],
      extendedAddress: [null],
      locality: [null],
      postalCode: [null],
      region: [null],
      country: [null],
    }),
  });

  private paymentTerms = this.formBuilder.group({
    dueDate: [null],
    lateFeesFix: [null, Validators.min(0)],
    lateFeesPercent: [null, Validators.min(0)],
  });

  constructor(
    private formBuilder: FormBuilder,
    private web3Service: Web3Service,
    private utilService: UtilService,
    private router: Router
  ) {
    this.payeeETHAddress.setValidators(
      Validators.compose([
        this.web3Service.isAddressValidator(this.currency),
        this.web3Service.isSameAddressValidator(this.payerETHAddress),
        Validators.required,
      ])
    );

    this.payerETHAddress.setValidators(
      Validators.compose([
        this.web3Service.isAddressValidator(this.currency),
        this.web3Service.isSameAddressValidator(this.payeeETHAddress),
        Validators.required,
      ])
    );

    this.addInvoiceItem(false);
    this.addInvoiceItem(false);

    this.invoiceData = this.formBuilder.group({
      meta: {
        format: 'rnf_invoice',
        version: '0.0.1',
      },
      creationDate: this.creationDate,
      invoiceNumber: this.invoiceNumber,
      purchaseOrderId: this.purchaseOrderId,
      note: this.note,
      terms: this.terms,
      sellerInfo: this.sellerInfo,
      buyerInfo: this.buyerInfo,
      invoiceItems: this.invoiceItems,
      paymentTerms: this.paymentTerms,
    });

    this.form = this.formBuilder.group({
      payee: this.payeeETHAddress,
      payer: this.payerETHAddress,
      currency: this.currency,
      deliveryDate: this.deliveryDate,
      data: this.invoiceData,
    });
  }

  private invoiceItems = new FormArray([], Validators.required);
  private invoiceItemsColumns = [
    'name',
    'quantity',
    'unitPrice',
    'discount',
    'taxPercent',
    'amount',
  ];

  private account;

  private shouldShowSellerDetails = false;
  private shouldShowBuyerDetails = false;
  private sendingInvoice = false;

  private taxFreeTotal;
  private vatTotal;
  private totalWithTax;

  private addInvoiceItem(rerender = true) {
    this.invoiceItems.push(
      this.formBuilder.group({
        name: [null, Validators.required],
        quantity: [
          null,
          Validators.compose([Validators.required, Validators.min(0)]),
        ],
        unitPrice: [
          null,
          Validators.compose([Validators.required, Validators.min(0)]),
        ],
        discount: [null],
        taxPercent: [null, Validators.required],
      })
    );
    if (rerender) {
      this.itemsTable.renderRows();
    }
  }

  private deleteInvoiceItem(index) {
    this.invoiceItems.removeAt(index);
    this.itemsTable.renderRows();
  }

  getTaxFreeTotal() {
    return this.invoiceItems.value.reduce(
      (acc, item) =>
        acc + item.quantity * (item.unitPrice - (item.discount || 0)),
      0
    );
  }

  getVatTotal() {
    return this.invoiceItems.value.reduce(
      (acc, item) =>
        acc +
        item.quantity *
          (item.unitPrice - (item.discount || 0)) *
          (item.taxPercent * 0.01),
      0
    );
  }

  updateTotals() {
    this.taxFreeTotal = this.getTaxFreeTotal();
    this.vatTotal = this.getVatTotal();
    this.totalWithTax = this.taxFreeTotal + this.vatTotal;
  }

  sendInvoice() {
    this.sendingInvoice = true;

    if (this.web3Service.watchDog()) {
      this.sendingInvoice = false;
      return;
    }

    if (this.form.invalid) {
      this.sendingInvoice = false;
      this.validateAllFormFields(this.form);
      this.utilService.openSnackBar('Some form fields are invalid.');
      return;
    }

    // Deep clone and remove empty values
    const cleanDeepClone = (obj, target = {}) =>
      Object.entries(obj).reduce((acc, [key, val]) => {
        if (val) {
          if (Array.isArray(val)) {
            acc[key] = cleanDeepClone(val, []);
          } else if (moment.isMoment(val)) {
            acc[key] = moment(val);
          } else if (typeof val === 'object') {
            acc[key] = cleanDeepClone(val);
          } else {
            acc[key] = val;
          }
        }
        return acc;
      }, target);

    const data = cleanDeepClone(this.invoiceData.value);

    if (!data['invoiceItems'].length) {
      this.sendingInvoice = false;
      this.utilService.openSnackBar('Invoice must contain at least one item');
      return;
    }

    const deliveryDate =
      this.deliveryDate.value && moment.isMoment(this.deliveryDate.value)
        ? this.deliveryDate.value.toISOString()
        : null;

    data['invoiceItems'].forEach(item => {
      item['currency'] = this.currency.value;
      if (deliveryDate) {
        item['deliveryDate'] = deliveryDate;
      }
    });

    if (data['creationDate'] && moment.isMoment(data['creationDate'])) {
      data['creationDate'] = data['creationDate'].toISOString();
    }
    if (
      data['paymentTerms'] &&
      data['paymentTerms']['dueDate'] &&
      moment.isMoment(data['creationDate']['dueDate'])
    ) {
      data['paymentTerms']['dueDate'] = data['paymentTerms'][
        'dueDate'
      ].toISOString();
    }

    /* TODO: uncomment when requestnetwork-data-format is working with webpack.
    const result = RequestNetworkDataFormat.validate(data);
    if (!result.valid) {
      this.sendingInvoice = false;
      this.utilService.openSnackBar(result.errors);
      return;
    }
    */

    const callback = response => {
      this.sendingInvoice = false;

      if (response.transaction) {
        this.utilService.openSnackBar(
          'The request is being created. Please wait a few moments for it to appear on the Blockchain.',
          'Ok',
          'info-snackbar'
        );
        const request = {
          payee: {
            address: this.payeeETHAddress.value,
            balance: this.totalWithTax,
            expectedAmount: this.totalWithTax,
          },
          currencyContract: {
            payeePaymentAddress:
              this.payeeETHAddress.value &&
              this.payeeETHAddress.value !== this.account
                ? this.payeeETHAddress.value
                : null,
          },
          currency: this.currency.value,
          payer: this.payerETHAddress.value,
          data: { data: Object.assign({}, data) },
        };

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

    this.updateTotals();

    this.web3Service
      .createRequest(
        'Payee',
        this.payerETHAddress.value,
        this.totalWithTax.toString(),
        this.currency.value,
        this.payeeETHAddress.value,
        { data },
        this.payerETHAddress.value
      )
      .on('broadcasted', response => {
        callback(response);
      })
      .catch(err => {
        callback(err);
      });
  }

  validateAllFormFields(formControl) {
    let controls;
    if (formControl instanceof FormGroup) {
      controls = Object.values(formControl.controls);
    } else if (formControl instanceof FormArray) {
      controls = formControl.controls;
    }

    controls.forEach(control => {
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.validateAllFormFields(control);
      }
    });
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
    this.watchAccount();

    this.invoiceItems.valueChanges.subscribe(change => {
      this.updateTotals();
    });
    this.updateTotals();
  }

  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.payeeETHAddress.setValue(account);
      this.account = account;
      this.payerETHAddress.updateValueAndValidity();
    });
  }
}

interface InvoiceItems {
  name: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxPercent: number;
  deliveryDate?: Date;
  deliveryPeriod?: string;
}
