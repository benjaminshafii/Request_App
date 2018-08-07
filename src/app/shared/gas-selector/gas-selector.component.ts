import { Component, OnInit } from '@angular/core';
import { GasService } from '../../util/gas.service';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-gas-selector',
  templateUrl: './gas-selector.component.html',
  styleUrls: ['./gas-selector.component.scss']
})
export class GasSelectorComponent implements OnInit {
  constructor(private gasService: GasService) {}

  public noGasPrices = false;
  public currentGasCategory = 'safeLow';
  public gasPricesObservable = this.gasService.getGasPrices();

  ngOnInit() {
    this.gasPricesObservable.subscribe({
      next: prices => {
        this.gasService.gasPrice = prices.safeLow;
      },
      error: err => {
        this.noGasPrices = true;
      }
    });
  }

  public customClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  public selectGasCategory(gasPriceCategory: string, gasPrice: number) {
    this.currentGasCategory = gasPriceCategory;
    if (gasPrice) {
      this.gasService.gasPrice = gasPrice;
    }
  }

  sliderInput(event: MatSliderChange) {
    this.selectGasCategory('custom', event.value);
  }
}
