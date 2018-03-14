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
  ipfsData: any;
  callbackUrl: string;
  queryParamError: boolean;
  redirectUrl: string;
  date = new Date();

  constructor(@Inject(DOCUMENT) private document: any, public web3Service: Web3Service, public router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.ready) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return this.ngOnInit();
    }

      const data =  this.route.snapshot.queryParams.data ? JSON.parse(this.route.snapshot.queryParams.data) : null;
      if (!data || !data.callbackUrl || !data.signedRequest) {
        return this.queryParamError = true;
      }

      if (data.signedRequest.data) {
        this.ipfsData = await this.web3Service.getIpfsData(data.signedRequest.data);
      }
      this.callbackUrl = data.callbackUrl;
      this.signedRequest = data.signedRequest;
  }

  acceptAndPay() {
    this.web3Service.broadcastSignedRequestAsPayer(this.signedRequest, [this.signedRequest.expectedAmounts[0]])
      .on('broadcasted',
        res => {
          if (res.transaction && res.transaction.hash) {
            this.redirectUrl = `${this.callbackUrl}${res.transaction.hash}`;
            setTimeout( _ => this.document.location.href = `${this.callbackUrl}${res.transaction.hash}`, 5000);
          }
        })
      .then(
        response => {},
        err => {
          console.error(err);
          this.web3Service.openSnackBar(err.message);
        });
  }

  cancelRequest() {
    this.document.location.href = `${this.callbackUrl}?signedRequest=${this.signedRequest}`;
  }

}
