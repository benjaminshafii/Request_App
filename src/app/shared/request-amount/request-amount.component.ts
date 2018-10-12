import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'request-amount',
  templateUrl: './request-amount.component.html',
  styleUrls: ['./request-amount.component.scss'],
})
export class RequestAmountComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  @Input()
  amount: string;

  @Input()
  currency: string;

  @Input()
  convertTo: string = null;
}
