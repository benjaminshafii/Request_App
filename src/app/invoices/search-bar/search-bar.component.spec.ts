import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule, MatSnackBarModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchBarComponent } from './search-bar.component';
import { Web3Service } from '../../util/web3.service';
import { Router } from '@angular/router';

class MockComponent {}

describe('Component: SearchBar', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        MatSnackBarModule,
        MatInputModule,
        RouterTestingModule.withRoutes([
          {
            path: 'search',
            component: MockComponent
          },
          {
            path: 'request/requestId',
            component: MockComponent
          }
        ])
      ],
      declarations: [SearchBarComponent],
      providers: [Web3Service]
    });

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
  });

  it('should redirect to search page when searching for ETH address', () => {
    const ETH_ADDR = '0x0000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.search(ETH_ADDR);
    expect(navigateSpy).toHaveBeenCalledWith(['/search', ETH_ADDR]);
  });

  it('should redirect to request page when searching for Request ID', () => {
    const REQ_ID =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.search(REQ_ID);
    expect(navigateSpy).toHaveBeenCalledWith(['/request/requestId', REQ_ID]);
  });

  it('should update search value when searching ETH address on search page', () => {
    const ETH_ADDR = '0x0000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    router.routerState.snapshot.url = '/search';

    const web3Service = TestBed.get(Web3Service);
    const web3SetSearchSpy = spyOn(web3Service, 'setSearchValue');

    component.search(ETH_ADDR);
    expect(web3SetSearchSpy).toHaveBeenCalledWith(ETH_ADDR);
  });

  it('should redirect to request page when searching Request Id on search page', () => {
    const REQ_ID =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    router.routerState.snapshot.url = '/search';
    const navigateSpy = spyOn(router, 'navigate');

    component.search(REQ_ID);
    expect(navigateSpy).toHaveBeenCalledWith(['/request/requestId', REQ_ID]);
  });

  it('should redirect to search page when searching ETH address on request page', () => {
    const ETH_ADDR = '0x0000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    router.routerState.snapshot.url = '/request/requestId';
    const navigateSpy = spyOn(router, 'navigate');

    component.search(ETH_ADDR);
    expect(navigateSpy).toHaveBeenCalledWith(['/search', ETH_ADDR]);
  });

  it('should update search value when searching Request Id on request page', () => {
    const REQ_ID =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    const router = TestBed.get(Router);
    router.routerState.snapshot.url = '/request/requestId';

    const web3Service = TestBed.get(Web3Service);
    const web3SetSearchSpy = spyOn(web3Service, 'setSearchValue');

    component.search(REQ_ID);
    expect(web3SetSearchSpy).toHaveBeenCalledWith(REQ_ID);
  });
});
