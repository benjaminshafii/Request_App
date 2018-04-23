import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import { PayDialogComponent } from '../util/dialogs/pay-dialog.component';
import { MatDialog } from '@angular/material';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-pay-with-request',
  templateUrl: './pay-with-request.component.html',
  styleUrls: ['./pay-with-request.component.scss'],
})
export class PayWithRequestComponent implements OnInit {
  Object = Object;
  signedRequest: any;
  currency: string;
  ipfsData: any;
  callbackUrl: string;
  queryParamError: boolean;
  redirectUrl: string;
  date = new Date();


  constructor(
    @Inject(DOCUMENT) private document: any,
    public web3Service: Web3Service,
    public router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}
  

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

    const data = JSON.parse(this.route.snapshot.params.data);
    if (!data || !data.callbackUrl || !data.signedRequest || !data.networkId) {
      return (this.queryParamError = true);
    }

    if (data.signedRequest.data) {
      this.ipfsData = await this.web3Service.getIpfsData(
        data.signedRequest.data
      );
    }
    this.callbackUrl = data.callbackUrl;
    this.signedRequest = data.signedRequest;
    this.web3Service
      .getTokenAddress(data.signedRequest.currencyContract)
      .then(tokenAddress => {
        this.currency = this.web3Service.getCurrency(tokenAddress);
      });

    // check signed request
    this.web3Service.accountObservable.subscribe(account => {
      if (
        account &&
        this.web3Service.networkIdObservable.value !== data.networkId
      ) {
        this.web3Service.openSnackBar(
          `Wrong network detected, please switch to ${this.getNetworkName(
            data.networkId
          )}`
        );
      }
      // const test = this.web3Service.isSignedRequestHasError(this.signedRequest, account);
    });
  }


  getNetworkName(networkId) {
    switch (networkId) {
      case 1:
        return 'Mainnet';
      case 4:
        return 'Rinkeby testnet';
    }
  }
  callbackTx(response, msg ? ) {
    if (response.transaction) {
      this.web3Service.openSnackBar(
        msg || 'Transaction in progress.',
        'Ok',
        'info-snackbar'
      );
    } else if (response.message) {
      if (response.message.startsWith('Invalid status 6985')) {
        this.web3Service.openSnackBar(
          'Invalid status 6985. User denied transaction.'
        );
      } else if (
        response.message.startsWith(
          'Failed to subscribe to new newBlockHeaders'
        )
      ) {
        return;
      } else {
        console.error(response);
        this.web3Service.openSnackBar(response.message);
      }
    }
  }

  acceptAndPay() {
    return this.dialog
      .open(PayDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        data: {
          immutableAmount: true,
          allow: (amount, targetAddress) =>
            this.web3Service.allowSignedRequest(
              this.signedRequest,
              amount,
              targetAddress,
              this.callbackTx
            ),
          request: {
            currency: this.currency,
            payee: {
              hello: () => console.log('i'),
              expectedAmount: this.web3Service.BN(
                this.signedRequest.expectedAmounts[0]
              ),
              balance: this.web3Service.BN(0),
            },
            currencyContract: {
              tokenAddress: environment.currencyToContract[this.currency],
              address: this.signedRequest.currencyContract,
            },
          },
        },
      })
      .afterClosed()
      .subscribe(amountValue => {
        if (amountValue) {
          this.web3Service
            .broadcastSignedRequestAsPayer(
              this.signedRequest,
              this.signedRequest.expectedAmounts,
              this.currency
            )
            .on('broadcasted', res => {
              if (res.transaction && res.transaction.hash) {
                this.redirectUrl = `${this.callbackUrl}${res.transaction.hash}`;
                setTimeout(
                  _ =>
                  (this.document.location.href = `${this.callbackUrl}${
                      res.transaction.hash
                    }`),
                  5000
                );
              }
            })
            .then(
              response => {},
              err => {
                if (err.message.startsWith('Invalid status 6985')) {
                  this.web3Service.openSnackBar(
                    'Invalid status 6985. User denied transaction.'
                  );
                } else if (
                  err.message.startsWith(
                    'Failed to subscribe to new newBlockHeaders'
                  )
                ) {
                  return;
                } else if (err.message.startsWith('_from must be different')) {
                  this.web3Service.openSnackBar(
                    `You can't create a request for yourself`
                  );
                } else if (
                  err.message.startsWith('balance of token is too low')
                ) {
                  this.web3Service.openSnackBar(
                    'Insufficient funds, check your token balance '
                  );
                } else if (
                  err.message.startsWith(
                    'Returned error: Error: MetaMask Tx Signature'
                  )
                ) {
                  this.web3Service.openSnackBar(
                    'MetaMask Tx Signature: User denied transaction signature.'
                  );
                } else {
                  console.error(err);
                  this.web3Service.openSnackBar(err.message);
                }
              }
            );
        }
      });
  }

  cancelRequest() {
    this.document.location.href = `${this.callbackUrl}${encodeURIComponent(
      JSON.stringify({ signedRequest: this.signedRequest })
    )}`;
  }
}
