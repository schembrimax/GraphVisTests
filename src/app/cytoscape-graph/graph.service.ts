import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable,  of } from 'rxjs';
import { map} from 'rxjs/operators'
import { GraphElement, GraphOptions, GraphElementStyle } from './cytoscape-graph.domain';
import styleData from './topology-style.js';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor(protected http: HttpClient) { }

  listElements(): Observable<cytoscape.ElementDefinition[]> {
    return this.http.get<GraphElement>('assets/Topology/topology.json').pipe(
      map(data => data.nodes)
    );
  }

  listStyles(): Observable<cytoscape.Stylesheet[]> {
    return of(styleData.style);
  }
  
  loadLayout(): Observable<cytoscape.LayoutOptions | undefined> {
    return this.http.get<GraphOptions>('assets/Topology/topology-layout.json').pipe(
      map(data => data.data)
    );
  }

}
