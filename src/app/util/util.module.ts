import { NgModule } from '@angular/core';
import { Web3Service } from './web3.service';
import { UtilService } from './util.service';

@NgModule({
  imports: [],
  providers: [Web3Service, UtilService],
  declarations: []
})
export class UtilModule {}
