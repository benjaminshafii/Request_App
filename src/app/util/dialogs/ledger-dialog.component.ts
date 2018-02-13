import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../web3.service';

@Component({
  templateUrl: './ledger-dialog.component.html'
})
export class LedgerDialogComponent {
  error: any;
  loading = false;

  networks = [
    { id: 1, name: 'Main net' },
    { id: 3, name: 'Ropsten Test Net' },
    { id: 42, name: 'Kovan Test Net' },
    { id: 4, name: 'Rinkeby Test Net' }
  ];
  networkId: number;

  constructor(private web3Service: Web3Service, private dialogRef: MatDialogRef < LedgerDialogComponent > , @Inject(MAT_DIALOG_DATA) public data: any) {
    this.networkId = 4;
    // this.networkId = this.web3Service.networkIdObservable.value;
  }

  connectLedger() {
    if (this.loading) { return true; }
    this.error = '';
    this.loading = true;

    this.web3Service.connectLedger(this.networkId).then(
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
