import { NgModule } from '@angular/core';
import { GasService } from './gas.service';
import { Web3Service } from './web3.service';
import { UtilService } from './util.service';

@NgModule({
  imports: [],
  providers: [GasService, Web3Service, UtilService],
  declarations: [],
})
export class UtilModule {}
