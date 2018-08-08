import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  searchForm: FormGroup;
  searchValueFormControl: FormControl;

  constructor(
    private web3Service: Web3Service,
    private utilService: UtilService,
    private formBuilder: FormBuilder,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.searchValueFormControl = new FormControl('');
    this.searchForm = this.formBuilder.group({
      searchValueFormControl: this.searchValueFormControl,
    });

    this.utilService.searchValue.subscribe(searchValue => {
      this.searchValueFormControl.setValue(searchValue);
    });
  }

  search(searchValue) {
    searchValue = searchValue.split(' ').join('');
    if (this.router.routerState.snapshot.url.startsWith('/request')) {
      if (searchValue.length <= 42) {
        this.router.navigate(['/search', searchValue]);
      } else {
        this.utilService.setSearchValue(searchValue);
      }
    } else if (this.router.routerState.snapshot.url.startsWith('/search')) {
      if (searchValue.length > 42) {
        this.router.navigate(['/request/requestId', searchValue]);
      } else {
        this.utilService.setSearchValue(searchValue);
      }
    } else {
      if (searchValue.length <= 42) {
        this.router.navigate(['/search', searchValue]);
      } else if (searchValue.length > 42) {
        this.router.navigate(['/request/requestId', searchValue]);
      }
    }
  }
}
