import { TestBed } from '@angular/core/testing';

import { SparqlServiceService } from './sparql-service.service';

describe('SparqlServiceService', () => {
  let service: SparqlServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SparqlServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
