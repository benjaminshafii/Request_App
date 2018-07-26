import { Injectable } from '@angular/core';

@Injectable()
export class UtilService {
  constructor() {}

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
}
