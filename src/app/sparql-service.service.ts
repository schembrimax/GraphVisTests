import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class SparqlService {

  constructor(protected http: HttpClient) { }

  querySparqlEndpoint(endpointUrl: string, query: string):Observable<any> {
    const headers = new HttpHeaders()
                    .set('Content-Type','text/plain')
                    .set('Accept','application/sparql-results+json');
    return this.http.get(endpointUrl, { headers, params: { query } });
  }

}
