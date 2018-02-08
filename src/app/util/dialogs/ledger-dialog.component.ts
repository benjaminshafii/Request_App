import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../web3.service';

@Component({
  templateUrl: './ledger-dialog.component.html'
})
export class LedgerDialogComponent {
  error: any;
  loading = false;

  constructor(private web3Service: Web3Service, private dialogRef: MatDialogRef < LedgerDialogComponent > , @Inject(MAT_DIALOG_DATA) public data: any) {}

  connectLedger() {
    if (this.loading) { return true; }
    this.error = '';
    this.loading = true;

    this.web3Service.connectLedger().then(
      res => {
        this.loading = false;
        this.dialogRef.close();
      },
      err => {
        this.loading = false;
        this.error = err;
      });

  }

}
