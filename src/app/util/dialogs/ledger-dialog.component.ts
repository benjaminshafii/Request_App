import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from '../web3.service';
const Web3 = require('web3');

@Component({
  templateUrl: './ledger-dialog.component.html',
})
export class LedgerDialogComponent {
  error: any;
  loading = false;
  derivationPath = `44'/60'/0'`;
  networks = [
    { id: 1, name: 'Main net' },
    // { id: 3, name: 'Ropsten Test Net' },
    // { id: 42, name: 'Kovan Test Net' },
    { id: 4, name: 'Rinkeby Test Net' },
  ];
  networkId: number;
  addresses: any;

  constructor(
    private web3Service: Web3Service,
    private dialogRef: MatDialogRef<LedgerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.networkId = this.web3Service.networkIdObservable.value;
  }

  async checkLedger(derivationPathIndex?) {
    if (this.loading) {
      return true;
    }
    this.error = '';
    this.loading = true;

    const accounts = await this.web3Service.checkLedger(
      this.networkId,
      this.derivationPath,
      derivationPathIndex
    );

    this.loading = false;

    if (Array.isArray(accounts)) {
      this.addresses = accounts;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          this.web3Service.infuraNodeUrl[this.networkId]
        )
      );
      for (const address of this.addresses) {
        web3.eth.getBalance(address.address).then(balance => {
          address.balance = this.web3Service.BNToAmount(this.web3Service.BN(balance), 'ETH');
        });
      }
    } else {
      this.error = accounts;
    }
  }

  instanciateWeb3FromLedger(derivationPathIndex) {
    this.web3Service.instanciateWeb3FromLedger(
      this.networkId,
      this.derivationPath,
      derivationPathIndex
    );
    this.dialogRef.close();
  }
}
