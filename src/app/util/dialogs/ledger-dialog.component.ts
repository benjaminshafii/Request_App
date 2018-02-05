import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../web3.service';

@Component({
  templateUrl: './ledger-dialog.component.html'
})
export class LedgerDialogComponent {
  error: string;

  constructor(private web3Service: Web3Service, private dialogRef: MatDialogRef < LedgerDialogComponent > , @Inject(MAT_DIALOG_DATA) public data: any) {}

  async connectLedger() {
    this.error = '';
    const result = await this.web3Service.connectLedger();

    if (result.error) {
      this.error = result.error;
    }

    // this.dialogRef.close();
  }

}
