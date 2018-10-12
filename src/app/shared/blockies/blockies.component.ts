import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-blockies',
  templateUrl: './blockies.component.html',
  styleUrls: ['./blockies.component.scss'],
})
export class BlockiesComponent implements OnInit {
  constructor() {}

  @Input()
  address: string;

  @Input()
  blockchainName: string = 'ETH';
  ngOnInit() {}
}
