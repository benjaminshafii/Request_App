import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../../util/web3.service';
import { MatPaginator, MatTableDataSource, MatSort } from '@angular/material';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  date = new Date().getTime();
  searchValue: string;
  subscription;
  displayedColumns = [
    'requestId',
    '_meta.timestamp',
    'request.payee.address',
    'request.payer',
    'request.payee.expectedAmount',
    'request.payee.balance',
    'request.status'
  ];
  dataSource = new MatTableDataSource();
  loading = true;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private web3Service: Web3Service,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

    this.subscription = this.web3Service.searchValue.subscribe(
      async searchValue => {
        this.searchValue = searchValue;
        this.loading = true;
        this.dataSource.data = [];
        if (searchValue !== this.searchValue) {
          history.pushState(null, null, `/#/search/${searchValue}`);
        }
        const results = await this.web3Service.getRequestsByAddress(
          searchValue
        );
        if (!results || !results.asPayer || !results.asPayee) {
          return (this.dataSource.data = []);
        }
        let resultsList = results.asPayer.concat(results.asPayee);
        resultsList = resultsList.sort(
          (a, b) => b._meta.timestamp - a._meta.timestamp
        );
        this.getRequestsFromIds(resultsList);
        this.dataSource.data = resultsList;
        this.loading = false;
      }
    );

    if (this.route.snapshot.params['searchValue']) {
      setTimeout(() =>
        this.web3Service.setSearchValue(
          this.route.snapshot.params['searchValue']
        )
      );
    }
  }

  getRequestsFromIds(resultsList) {
    for (const result of resultsList) {
      this.web3Service
        .getRequestByRequestId(result.requestId)
        .then(requestObject => {
          result.request = requestObject.requestData;
        });
    }
  }

  getAgeFromTimeStamp(timestamp) {
    if (!timestamp) {
      return '';
    }
    const time = this.date - timestamp * 1000;
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    let msg = days === 1 ? `${days} day ` : days > 1 ? `${days} days ` : '';
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    msg += hours === 1 ? `${hours} hr ` : hours > 1 ? `${hours} hrs ` : '';
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    msg +=
      minutes === 1 ? `${minutes} min ` : minutes > 1 ? `${minutes} mins ` : '';
    return msg ? `${msg}ago` : 'less than 1 min ago';
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
