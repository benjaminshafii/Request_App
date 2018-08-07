import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, catchError, tap, shareReplay } from 'rxjs/operators';

@Injectable()
export class GasService {
  constructor(private http: HttpClient) {}

  // public gasStationEndpoint = 'https://ethgasstation.info/json/ethgasAPI.json';
  public etherchainGasOracleEndpoint = 'https://www.etherchain.org/api/gasPriceOracle';
  public gasPrice = 10; // In gwei

  public getGasPrices() {
    return this.http
      .get<EtherchainGasResponse>(this.etherchainGasOracleEndpoint)
      .pipe(retry(3), shareReplay());
  }
}

export interface EtherchainGasResponse {
  safeLow: number;
  standard: number;
  fast: number;
  fastest: number;
}
