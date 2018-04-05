import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Web3Service } from '../util/web3.service';

@Component({
  selector: 'app-pay-with-request',
  templateUrl: './pay-with-request.component.html',
  styleUrls: ['./pay-with-request.component.scss']
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

  constructor(@Inject(DOCUMENT) private document: any, public web3Service: Web3Service, public router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

    const data = JSON.parse(this.route.snapshot.params.data);
    if (!data || !data.callbackUrl || !data.signedRequest || !data.networkId) {
      return this.queryParamError = true;
    }

    if (data.signedRequest.data) {
      this.ipfsData = await this.web3Service.getIpfsData(data.signedRequest.data);
    }
    this.callbackUrl = data.callbackUrl;
    this.signedRequest = data.signedRequest;
    this.currency = 'REQ';

    // check signed request
    this.web3Service.accountObservable.subscribe(account => {
      if (account && this.web3Service.networkIdObservable.value !== data.networkId) {
        this.web3Service.openSnackBar(`Wrong network detected, please switch to ${this.getNetworkName(data.networkId)}`);
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


  acceptAndPay() {
    this.web3Service.broadcastSignedRequestAsPayer(this.signedRequest, [this.signedRequest.expectedAmounts[0]], this.currency)
      .on('broadcasted',
        res => {
          if (res.transaction && res.transaction.hash) {
            this.redirectUrl = `${this.callbackUrl}${res.transaction.hash}`;
            setTimeout(_ => this.document.location.href = `${this.callbackUrl}${res.transaction.hash}`, 5000);
          }
        })
      .then(
        response => {},
        err => {
          if (err.message.startsWith('Invalid status 6985')) {
            this.web3Service.openSnackBar('Invalid status 6985. User denied transaction.');
          } else if (err.message.startsWith('Failed to subscribe to new newBlockHeaders')) {
            return;
          } else if (err.message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
            this.web3Service.openSnackBar('MetaMask Tx Signature: User denied transaction signature.');
          } else {
            console.error(err);
            this.web3Service.openSnackBar(err.message);
          }
        });
  }


  cancelRequest() {
    this.document.location.href = `${this.callbackUrl}${encodeURIComponent(JSON.stringify({signedRequest: this.signedRequest}))}`;
  }

}
