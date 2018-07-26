import { TestBed, inject } from '@angular/core/testing';
import { UtilService } from './util.service';

describe('Service: UtilService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UtilService]
    });
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it(
    'should be created',
    inject([UtilService], (service: UtilService) => {
      expect(service).toBeTruthy();
    })
  );

  it(
    'should display timeAgo from timestamp',
    inject([UtilService], (service: UtilService) => {
      const TIME = 1504138;
      const timestamps = [
        {
          timestamp: null,
          message: ''
        },
        {
          timestamp: TIME - 1,
          message: 'less than 1 min ago'
        },
        {
          timestamp: TIME - 60,
          message: '1 min ago'
        },
        {
          timestamp: TIME - 60 * 10,
          message: '10 mins ago'
        },
        {
          timestamp: TIME - 60 * 60,
          message: '1 hr ago'
        },
        {
          timestamp: TIME - 60 * 60 * 10,
          message: '10 hrs ago'
        },
        {
          timestamp: TIME - 60 * 60 * 24,
          message: '1 day ago'
        },
        {
          timestamp: TIME - 60 * 60 * 24 * 10,
          message: '10 days ago'
        },
        {
          timestamp: TIME - 60 * 60 * 24 - 60 * 60 * 2 - 60 * 10,
          message: '1 day 2 hrs 10 mins ago'
        },
        {
          timestamp: TIME - 60 * 60 * 24 * 36500,
          message: '36500 days ago'
        }
      ];
      jasmine.clock().mockDate(new Date(TIME * 1000));
      timestamps.forEach(({ timestamp, message }) => {
        const msg = service.getAgeFromTimeStamp(timestamp);
        expect(msg).toEqual(message);
      });
    })
  );
});
