import { TestBed, inject } from '@angular/core/testing';

import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionsService]
    });
  });

  it('should be created', inject([SessionsService], (service: SessionsService) => {
    expect(service).toBeTruthy();
  }));
});
