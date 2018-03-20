import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Web3Service } from '../../util/web3.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { PayDialogComponent } from '../../util/dialogs/pay-dialog.component';
import { SubtractDialogComponent } from '../../util/dialogs/subtract-dialog.component';
import { AdditionalDialogComponent } from '../../util/dialogs/additional-dialog.component';
import { RefundDialogComponent } from '../../util/dialogs/refund-dialog.component';


@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss'],
})
export class RequestComponent implements OnInit, OnDestroy {
  objectKeys = Object.keys;
  account: string;
  mode: string;
  request: any;
  progress: number;
  url = window.location.href;
  copyUrlTxt = 'Copy url';
  txHash: string;
  subscription: any;
  searchValue: string;
  timerInterval: any;
  loading = false;


  constructor(public web3Service: Web3Service, private route: ActivatedRoute, private dialog: MatDialog) {}


  async ngOnInit() {
    // wait for web3 to be instantiated
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
    this.watchAccount();

    this.subscription = this.web3Service.searchValue.subscribe(async searchValue => {
      if (searchValue && searchValue.length > 42) {
        const request = await this.web3Service.getRequestByRequestId(searchValue);
        await this.setRequest(request);
        this.searchValue = searchValue;
        this.loading = false;
      }
    });

    if (this.route.snapshot.params['requestId']) {
      this.web3Service.setSearchValue(this.route.snapshot.params['requestId']);
    } else if (this.route.snapshot.params['txHash']) {
      this.txHash = this.route.snapshot.params['txHash'];
      this.watchRequestByTxHash();
    }

    // watch Request in background
    // this.timerInterval = setInterval(async _ => {
    //   if (!this.searchValue) { return; }
    //   const request = await this.web3Service.getRequestByRequestId(this.searchValue);
    //   this.setRequest(request);
    // }, 10000);
  }

  async watchTxHash(txHash) {
    const result = await this.web3Service.getRequestByTransactionHash(txHash);
    if (result.request && result.request.requestId) {
      await this.setRequest(result.request);
      this.loading = false;
    } else if (result.transaction) {
      setTimeout(await this.watchTxHash(txHash), 5000);
    }
  }


  async watchRequestByTxHash() {
    if (this.searchValue) { return console.log('stopped watching txHash'); }

    const result = await this.web3Service.getRequestByTransactionHash(this.txHash);
    if (result.request && result.request.requestId) {
      this.web3Service.setSearchValue(result.request.requestId);
    } else if (result.transaction) {
      const request = {
        waitingMsg: 'waiting for transaction to be mined...',
        payee: {
          address: result.transaction.method.parameters._payeesIdAddress[0],
          balance: this.web3Service.BN(this.web3Service.toWei('0')),
          expectedAmount: this.web3Service.BN(result.transaction.method.parameters._expectedAmounts[0]),
        },
        payer: result.transaction.method.parameters._payer,
        data: {data: null},
      };
      if (result.transaction.method.parameters._data) {
        request.data.data = await this.web3Service.getIpfsData(result.transaction.method.parameters._data);
      }
      await this.setRequest(request);

      setTimeout(await this.watchRequestByTxHash(), 5000);

      // } else if (Object.keys(this.route.snapshot.queryParams).length > 0 && this.route.snapshot.queryParams.payee && this.route.snapshot.queryParams.payee.address && this.route.snapshot.queryParams.payee.balance && this.route.snapshot.queryParams.payee.expectedAmount && this.route.snapshot.queryParams.payer) {
      //   const queryRequest = {
      //     payer: this.route.snapshot.queryParams.payer,
      //     payee: {
      //       address: this.route.snapshot.queryParams.payee,
      //       balance: this.web3Service.BN(this.web3Service.toWei('0')),
      //       expectedAmount: this.web3Service.BN(this.web3Service.toWei(this.route.snapshot.queryParams.expectedAmount))
      //     },
      //     data: { data: {} }
      //   };
      //   Object.keys(this.route.snapshot.queryParams).forEach((key) => {
      //     if (!queryRequest[key]) { queryRequest.data.data[key] = this.route.snapshot.queryParams[key]; }
      //   });
      //   if (!this.request) { setTimeout(() => this.request.errorMsg = 'unable to locate this Transaction Hash', 5000); }
      //   this.setRequest(queryRequest);
    } else {
      await this.setRequest({ errorTxHash: 'Sorry, we are unable to locate this Transaction Hash' });
    }
  }


  async setRequest(request) {
    // if new search
    if (request.requestId && ((!this.request && this.route.snapshot.params['txHash']) || this.request && this.request.requestId && this.request.requestId !== request.requestId)) {
      this.request = null;
      history.pushState(null, null, `/#/request/requestId/${request.requestId}`);
      this.url = `${window.location.protocol}//${window.location.host}/#/request/requestId/${request.requestId}`;
    }
    if (request.state) {
      this.web3Service.setRequestStatus(request);
    }
    if (request.requestId && !request.events) {
      request.events = await this.web3Service.getRequestEvents(request.requestId);
    }
    this.request = request;
    this.getRequestMode();
    if (request) { this.progress = 100 * this.request.payee.balance / this.request.payee.expectedAmount; }
  }


  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.account = account;
      this.getRequestMode();
    });
  }


  getAgeFromTimeStamp(timestamp) {
    if (!timestamp) { return ''; }
    const date = new Date().getTime();
    const days = Math.floor((date - timestamp * 1000) / (1000 * 60 * 60 * 24));
    let msg = days === 1 ? `${days} day ` : days > 1 ? `${days} days ` : '';
    const hours = Math.floor((date - timestamp * 1000) / (1000 * 60 * 60) % 24);
    msg += hours === 1 ? `${hours} hr ` : hours > 1 ? `${hours} hrs ` : '';
    const minutes = Math.floor((date - timestamp * 1000) / (1000 * 60) % 60);
    msg += minutes === 1 ? `${minutes} min ` : minutes > 1 ? `${minutes} mins ` : '';
    return msg ? `${msg}ago` : 'less than 1 min ago';
  }


  getRequestMode() {
    this.mode = this.request && this.account === this.request.payee.address ? 'payee' : this.request && this.account === this.request.payer ? 'payer' : 'none';
  }


  spaceBeforeCapital(name) {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }


  copyToClipboard() {
    this.copyUrlTxt = 'Copied!';
    setTimeout(() => { this.copyUrlTxt = 'Copy url & share'; }, 500);
  }


  refresh() {
    location.reload();
  }


  callbackTx(response, msg ? ) {
    if (response.transaction) {
      this.web3Service.openSnackBar(msg || 'Transaction in progress.', 'Ok', 'info-snackbar');
      this.loading = response.transaction.hash;
      this.watchTxHash(this.loading);
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


  cancelRequest() {
    this.web3Service.cancel(this.request.requestId, this.callbackTx)
      .on('broadcasted', response => {
        this.callbackTx(response, 'The request is being cancelled. Please wait a few moments for it to appear on the Blockchain.');
      }).then(
        response => {
          // setTimeout(_ => {
          //   this.loading = false;
          //   this.web3Service.openSnackBar('Request successfully cancelled.', 'Ok', 'success-snackbar');
          // }, 5000);
        }, err => {
          this.callbackTx(err);
        }
      );
  }


  acceptRequest() {
    this.web3Service.accept(this.request.requestId, this.callbackTx)
      .on('broadcasted', response => {
        this.callbackTx(response, 'The request is being accepted. Please wait a few moments for it to appear on the Blockchain.');
      }).then(
        response => {
          // setTimeout(_ => {
          //   this.loading = false;
          //   this.web3Service.openSnackBar('Request successfully accepted.', 'Ok', 'success-snackbar');
          // }, 5000);
        }, err => {
          this.callbackTx(err);
        });
  }


  subtractRequest() {
    this.dialog.open(SubtractDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          request: this.request
        }
      }).afterClosed()
      .subscribe(subtractValue => {
        if (subtractValue) {
          this.web3Service.subtractAction(this.request.requestId, subtractValue, this.callbackTx)
            .on('broadcasted', response => {
              this.callbackTx(response, 'Subtract in progress. Please wait a few moments for it to appear on the Blockchain.');
            }).then(
              response => {
                // setTimeout(_ => {
                //   this.loading = false;
                //   this.web3Service.openSnackBar('Subtract done.', 'Ok', 'success-snackbar');
                // }, 5000);
              }, err => {
                this.callbackTx(err);
              });
        }
      });
  }


  additionalRequest() {
    this.dialog.open(AdditionalDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          request: this.request
        }
      }).afterClosed()
      .subscribe(subtractValue => {
        if (subtractValue) {
          this.web3Service.additionalAction(this.request.requestId, subtractValue, this.callbackTx)
            .on('broadcasted', response => {
              this.callbackTx(response, 'Additional in progress. Please wait a few moments for it to appear on the Blockchain.');
            }).then(
              response => {
                // setTimeout(_ => {
                //   this.loading = false;
                //   this.web3Service.openSnackBar('Additional done.', 'Ok', 'success-snackbar');
                // }, 5000);
              }, err => {
                this.callbackTx(err);
              });
        }
      });
  }


  payRequest() {
    this.dialog.open(PayDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          request: this.request
        }
      }).afterClosed()
      .subscribe(amountValue => {
        if (amountValue) {
          this.web3Service.paymentAction(this.request.requestId, amountValue, this.callbackTx)
            .on('broadcasted', response => {
              this.callbackTx(response, 'Payment is being done. Please wait a few moments for it to appear on the Blockchain.');
            }).then(
              response => {
                // setTimeout(_ => {
                //   this.loading = false;
                //   this.web3Service.openSnackBar('Payment done.', 'Ok', 'success-snackbar');
                // }, 5000);
              }, err => {
                this.callbackTx(err);
              });
        }
      });
  }


  refundRequest() {
    this.dialog.open(RefundDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          request: this.request
        }
      }).afterClosed()
      .subscribe(amountValue => {
        if (amountValue) {
          this.web3Service.refundAction(this.request.requestId, amountValue, this.callbackTx)
            .on('broadcasted', response => {
              this.callbackTx(response, 'Refund in progress. Please wait a few moments for it to appear on the Blockchain.');
            }).then(
              response => {
                // setTimeout(_ => {
                //   this.loading = false;
                //   this.web3Service.openSnackBar('Refund done.', 'Ok', 'success-snackbar');
                // }, 5000);
              }, err => {
                this.callbackTx(err);
              });
        }
      });
  }


  ngOnDestroy() {
    if (this.subscription) { this.subscription.unsubscribe(); }
    if (this.timerInterval) { clearInterval(this.timerInterval); }
  }


}
