import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { retry, shareReplay } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable()
export class GasService {
  private gasStationEndpoint =
    'https://ethgasstation.info/json/ethgasAPI.json';
  public gasPricesObservable = new Subject<GasStationResponse>();
  public gasPrice = 10; // In gwei

  constructor(private http: HttpClient) {
    this.getGasPrices().subscribe({
      next: res =>
        this.gasPricesObservable.next({
          fast: res.fast / 10,
          fastest: res.fastest / 10,
          safeLow: res.safeLow / 10,
          average: res.average / 10,
        }),
      error: err => {
        this.gasPricesObservable.error(err);
      },
    });
  }

  public getGasPrices() {
    return this.http.get<GasStationResponse>(this.gasStationEndpoint).pipe(
      retry(3),
      shareReplay()
    );
  }
}

export interface GasStationResponse {
  fast: number;
  fastest: number;
  safeLow: number;
  average: number;
}
