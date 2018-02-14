import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../web3.service';

@Component({
  templateUrl: './ledger-dialog.component.html'
})
export class LedgerDialogComponent {
  error: any;
  loading = false;
  derivationPath = `44'/60'/0'/0`;
  networks = [
    { id: 1, name: 'Main net' },
    { id: 3, name: 'Ropsten Test Net' },
    { id: 42, name: 'Kovan Test Net' },
    { id: 4, name: 'Rinkeby Test Net' }
  ];
  networkId: number;
  addresses: any;


  constructor(private web3Service: Web3Service, private dialogRef: MatDialogRef < LedgerDialogComponent > , @Inject(MAT_DIALOG_DATA) public data: any) {
    this.networkId = 4;
    // this.networkId = this.web3Service.networkIdObservable.value;
  }

  checkLedger() {
    if (this.loading) { return true; }
    this.error = '';
    this.loading = true;

    this.web3Service.checkLedger(this.networkId, this.derivationPath).then(
      res => {
        this.loading = false;
        this.addresses = res;
      },
      err => {
        this.loading = false;
        this.error = err;
      });
  }


  async instanciateWeb3FromLedger(derivationPath) {
    await this.web3Service.instanciateWeb3FromLedger(this.networkId, derivationPath);
    this.dialogRef.close();
  }

}
