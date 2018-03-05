import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import blockies from 'blockies';

@Component({
  selector: 'app-pay-with-request',
  templateUrl: './pay-with-request.component.html',
  styleUrls: ['./pay-with-request.component.scss']
})
export class PayWithRequestComponent implements OnInit {
  blockies = blockies;
  signedRequest: any;
  date = new Date();

  constructor(@Inject(DOCUMENT) private document: any, public web3Service: Web3Service, public router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.ready) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return this.ngOnInit();
    }
    if (Object.entries(this.route.snapshot.queryParams).length) {
      this.signedRequest = JSON.parse(Object.values(this.route.snapshot.queryParams)[0]);
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
