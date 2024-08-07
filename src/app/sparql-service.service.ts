import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class SparqlService {

  constructor(protected http: HttpClient) { }

  //---------------------------------------------------------------------------------------------------------------------------------------------
  querySparqlEndpoint(endpointUrl: string, query: string):Observable<any> {
    const headers = new HttpHeaders()
                    .set('Content-Type','text/plain')
                    .set('Accept','application/sparql-results+json');
    return this.http.get(endpointUrl, { headers, params: { query } });
  }

  //---------------------------------------------------------------------------------------------------------------------------------------------
  findClasses(endpointUrl: string):Observable<any>{
    const headers = new HttpHeaders()
                    .set('Content-Type','text/plain')
                    .set('Accept','application/sparql-results+json');
    var query=`
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?class ?classLabel WHERE {
      ?class rdf:type owl:Class .
      ?class rdfs:label ?classLabel.

      FILTER(?class != owl:Thing && ?class !=owl:Nothing && !isBlank(?class)).
    } `;
    return this.http.get(endpointUrl, { headers, params: { query } });
  }

  //---------------------------------------------------------------------------------------------------------------------------------------------
  findClassInstances(endpointUrl: string, classtype:string ,startswith:string, contains:string[]):Observable<any>
  {
    const headers = new HttpHeaders()
                    .set('Content-Type','text/plain')
                    .set('Accept','application/sparql-results+json');

    startswith = startswith? "FILTER(STRSTARTS(LCASE(?classInstanceLabel),LCASE('"+ startswith +"')))." : "";
    var containsLine="";
    for(var str of contains )     
      containsLine += "FILTER CONTAINS( LCASE( str(?classInstanceLabel) ) , LCASE( '"+ str +"' )  ).\n";

    var query=`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
    SELECT distinct ?classInstance ?classInstanceLabel WHERE {
          ?classInstance a  `+classtype+` .
          ?classInstance rdfs:label ?classInstanceLabel .`+ startswith + containsLine + `
          FILTER(lang(?classInstanceLabel) = "en-gb" || lang(?classInstanceLabel) = "en-us" || lang(?classInstanceLabel) = "en")    
    } `;    
    return this.http.get(endpointUrl, { headers, params: { query } });
  }

  //---------------------------------------------------------------------------------------------------------------------------------------------
  findClassInstancesURIs(endpointUrl: string, classtype:string , contains:string[]):Observable<any>
  {
    const headers = new HttpHeaders()
                    .set('Content-Type','text/plain')
                    .set('Accept','application/sparql-results+json');

    
    var containsLine="";
    for(var str of contains )     
      containsLine += "FILTER CONTAINS( LCASE( str(?localName) ) , LCASE( '"+ str +"' )  ).\n";

    var query=`
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
    SELECT distinct ?classInstance WHERE {
          ?classInstance a  `+classtype+` .
          BIND (REPLACE(STR(?classInstance), "^.*/([^/]*)$", "$1") as ?localName)
          `+ containsLine + `
    } `;

    return this.http.get(endpointUrl, { headers, params: { query } });
  }
  //---------------------------------------------------------------------------------------------------------------------------------------------
}
