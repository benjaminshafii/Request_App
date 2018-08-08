import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  MatTableModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchComponent } from './search.component';
import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';

class MockComponent {}

describe('Component: Search', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MatSnackBarModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        RouterTestingModule.withRoutes([
          {
            path: '',
            component: MockComponent,
          },
        ]),
      ],
      declarations: [SearchComponent],
      providers: [Web3Service, UtilService],
    });

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
  });

  it(
    'getRequestsFromIds should call getRequestByRequestId',
    fakeAsync(() => {
      const web3Service = TestBed.get(Web3Service);
      const web3getRequestByRequestIdSpy = spyOn(
        web3Service,
        'getRequestByRequestId'
      ).and.returnValue(
        Promise.resolve({ requestData: { data: 'request-data' } })
      );

      const resultsList = [
        {
          requestId: '0',
        },
        {
          requestId: '1',
        },
        {
          requestId: '2',
        },
      ];
      const resultsListWithRequest = [
        {
          requestId: '0',
          request: { data: 'request-data' },
        },
        {
          requestId: '1',
          request: { data: 'request-data' },
        },
        {
          requestId: '2',
          request: { data: 'request-data' },
        },
      ];
      component.getRequestsFromIds(resultsList);

      tick();

      expect(web3getRequestByRequestIdSpy).toHaveBeenCalledTimes(3);
      expect(resultsList).toEqual(resultsListWithRequest);
    })
  );
});
