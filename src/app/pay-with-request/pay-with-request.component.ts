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
  signedRequest: any;
  date = new Date();
  data: any;

  constructor(@Inject(DOCUMENT) private document: any, public web3Service: Web3Service, public router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.ready) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return this.ngOnInit();
    }
    if (Object.entries(this.route.snapshot.queryParams).length) {
      this.signedRequest = JSON.parse(Object.values(this.route.snapshot.queryParams)[0]);
      if (this.signedRequest.data) {
        const ipfsData = await this.web3Service.getIpfsData(this.signedRequest.data);
        this.data = JSON.parse(ipfsData);
        console.log(this.data);
      }
      console.log(this.signedRequest);
    }
  }

  acceptAndPay() {
    this.web3Service.broadcastSignedRequestAsPayer(this.signedRequest, this.signedRequest.amountInitial)
      .on('broadcasted', res => {
        this.document.location.href = `${this.signedRequest.callbackUrl}?txHash=${res.txHash}`;
      });
  }

}
