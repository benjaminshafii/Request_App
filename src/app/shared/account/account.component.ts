import { Component } from '@angular/core';

import { Web3Service } from '../../util/web3.service';
import { MatDialog } from '@angular/material';
import { LedgerDialogComponent } from '../../util/dialogs/ledger-dialog.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {

  constructor(private web3Service: Web3Service, private dialog: MatDialog) {}


  openLedgerDialog() {
    this.dialog.open(LedgerDialogComponent, {
      hasBackdrop: true,
      width: '500px',
    });
  }

}
