import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';

@Injectable()
export class UtilService {
  public searchValue = new Subject<string>();

  constructor(private snackBar: MatSnackBar) {}

  public setSearchValue(searchValue: string) {
    this.searchValue.next(searchValue);
  }

  getAgeFromTimeStamp(timestamp) {
    if (!timestamp) {
      return '';
    }
    const time = new Date().getTime() - timestamp * 1000;
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    let msg = days === 1 ? `${days} day ` : days > 1 ? `${days} days ` : '';
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    msg += hours === 1 ? `${hours} hr ` : hours > 1 ? `${hours} hrs ` : '';
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    msg +=
      minutes === 1 ? `${minutes} min ` : minutes > 1 ? `${minutes} mins ` : '';
    return msg ? `${msg}ago` : 'less than 1 min ago';
  }

  public openSnackBar(
    msg: string,
    ok?: string,
    panelClass?: string,
    duration?: number
  ) {
    if (!msg) {
      return;
    }
    this.snackBar.open(msg, ok || 'Ok', {
      duration: duration || 7000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: panelClass || 'warning-snackbar'
    });
  }
}
