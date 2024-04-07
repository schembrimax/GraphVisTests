import { Component, ViewChild, ElementRef, OnDestroy, AfterContentInit, Inject, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { GraphService } from './graph.service';
import { SparqlService } from '../sparql-service.service';
import { HttpClientModule } from '@angular/common/http';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuModule } from 'primeng/menu';
import { ListboxModule} from 'primeng/listbox';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';


import cytoscape, { BaseLayoutOptions } from 'cytoscape';
import cola from 'cytoscape-cola';
import elk from 'cytoscape-elk';
import { MenuItem } from 'primeng/api';

interface SparqlResponse {
  head: {
      vars: string[]; // Variable names
  };
  results: {
      bindings: Array<{
          [variable: string]: {
              type: 'uri' | 'literal' | 'bnode' | 'typed-literal';
              value: string;
              'xml:lang'?: string; // Optional language tag for literals
              datatype?: string; // Optional datatype IRI for typed literals
          };
      }>;
  };
}



@Component({
  selector: 'app-cytoscape-graph',
  standalone: true,
  imports:[
    HttpClientModule, CommonModule, ContextMenuModule,
    MenuModule, ListboxModule, FormsModule, ButtonModule, PanelModule
  ],
  templateUrl: './cytoscape-graph.component.html',
  styleUrl: './cytoscape-graph.component.css'
})

export class CytoscapeGraphComponent {
  @ViewChild('cy') cytoElem: ElementRef;
  @ViewChild('matMenu') matMenu: ElementRef;
  @Output() optionSelected= new EventEmitter<string>();
  isVisible:boolean=false;
  menuLeft:string;
  menuTop:string;
  items:MenuItem[];
  cy: cytoscape.Core;
  selectedConn:any[] =[];
  outconnections:any[]=[
    { name:'conn 1'},
    { name:'conn 2'},
    { name:'conn 3'},
    { name:'conn 4'},
  ];


  constructor(private graphService:GraphService, private sparqlService:SparqlService){}

  ngAfterViewInit() {

    // commented because it causes error : ExpressionChangedAfterItHasBeenCheckedError
    //this.menuTrigger.openMenu();
    const endpoint = 'https://semantics.istc.cnr.it/hacid/sparql';
    const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX ho: <https://w3id.org/hacid/onto/mdx/>
    PREFIX hd: <https://w3id.org/hacid/mdx/data/>
    
    SELECT ?subject ?predicate ?object WHERE {
    
        ?s ?predicate ?o .
        ?s ho:broader+ ?o.
        
        ?o rdf:type ho:BodyStructure .
        ?s rdf:type ho:BodyStructure .
       
        ?s rdfs:label ?subject . 
        ?o rdfs:label ?object .
        
        FILTER (lang(?subject) = 'en-gb')
        FILTER (lang(?object) = 'en-gb')
      } 
    
    `;

    

    this.sparqlService.querySparqlEndpoint(endpoint, query)
      .subscribe({
        next: (data) => this.initCharts( this.convertDataToCytoscapeFormat(data)),
        error: (error)=> console.error('There was an error!', error)
      });   
  }
 
 
  selectOption(option: string) {
    this.optionSelected.emit(option);
    this.isVisible = false; // Hide the menu after selection
  }

  protected initCharts(elements: cytoscape.ElementDefinition[]) {
    console.log("Initializing charts....."+elements+"   ");
    cytoscape.use(elk);


    var elkoptions = {
    name:'elk',
    nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
    fit: true, // Whether to fit
    padding: 20, // Padding on fit
    animate: false, // Whether to transition the node positions
    animateFilter: function( node, i ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
    animationDuration: 500, // Duration of animation in ms if enabled
    animationEasing: undefined, // Easing of animation if enabled
    transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
    ready: undefined, // Callback on layoutready
    stop: undefined, // Callback on layoutstop
    nodeLayoutOptions: undefined, // Per-node options function
    elk: {
      // All options are available at http://www.eclipse.org/elk/reference.html
      //
      // 'org.eclipse.' can be dropped from the identifier. The subsequent identifier has to be used as property key in quotes.
      // E.g. for 'org.eclipse.elk.direction' use:
      // 'elk.direction'
      //
      // Enums use the name of the enum as string e.g. instead of Direction.DOWN use:
      // 'elk.direction': 'DOWN'
      //
      // The main field to set is `algorithm`, which controls which particular layout algorithm is used.
      // Example (downwards layered layout):
      'algorithm': 'stress',
      'elk.direction': 'UP',
      'elk.stress.desiredEdgeLength':'150'
    },
    priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
  };

  //******* Initialize cytoscape *******
  this.cy = cytoscape({
      container: this.cytoElem.nativeElement,
      elements:elements,
      style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': '#19a',
                'label': 'data(label)',
                'text-outline-color':'#888',
                'text-outline-width':'3',
                'color':'#fff'
            }
        },

        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style':'straight',
                'label': 'data(label)',
                'text-rotation': 'autorotate'
            }
        }
      ],

      layout: elkoptions ,
      wheelSensitivity:0.2
    });

    this.cy.on('tap','node', this.onNodeSelected1.bind(this));
    this.cy.on('mouseover', this.onMouseOver);
    this.cy.on('mouseout', this.onMouseOut);
    this.cy.on('tap', this.onTappingGeneral.bind(this))
  }

  ngOnInit():void{ 
     this.items =[
      {label:'one',icon:''},
      {label:'two',icon:''},
      {label:'three',icon:''},
      {label:'four',icon:''}
     ]

   }

  onTappingGeneral(evt)
  {
    if(evt.target==this.cy)
      this.isVisible=false;
  }

  onNodeSelected1(evt)
  {
    var node=evt.target;

    if(node!== this.cy)
    {
      this.isVisible = true;
      console.log('node position x '+node.renderedPosition('x'));
      console.log('node position y '+node.position.y);
      this.menuLeft = node.renderedPosition('x')+'px';    
      this.menuTop = node.renderedPosition('y')+'px';
    }

  }

  onMouseOver(evt)
  {
    var node=evt.target;
    node.data('label',node.data('longlabel') )
  }

  onMouseOut(evt)
  {
    var node=evt.target;
    //console.log("mouseout");
    node.data('label',node.data('shortlabel') )
  }

  convertDataToCytoscapeFormat(Results:SparqlResponse) {
    const elements: cytoscape.ElementDefinition[]=[];

    var sparqlResults = Results.results.bindings;

    console.log(" sparql result = "+JSON.stringify(Results, null, 2));

    
    // create nodes
    
    sparqlResults.forEach(result => {
        // Add nodes for subject and object
        var value:string = result['subject']['value'];
        elements.push({ data: { id: result['subject']['value'],
                                label: (result['subject']['value'].split('/').pop())?.substring(0,10),
                                longlabel:result['subject']['value'].split('/').pop(),
                                shortlabel:(result['subject']['value'].split('/').pop())?.substring(0,10)
                              } });
        //if (result.object.type === 'uri') {
        elements.push({ data: { id: result['object']['value'],
                                label: (result['object']['value'].split('/').pop())?.substring(0,10),
                                longlabel:result['object']['value'].split('/').pop(),
                                shortlabel:(result['object']['value'].split('/').pop())?.substring(0,10)
                              } });
        
        //
    } );

    //* creates edges
    sparqlResults.forEach(result => {
        // Add edge
        elements.push({
            data: {
                id: result['subject']['value'] + result['predicate']['value'] + result['object']['value'],
                source: result['subject']['value'],
                target: result['object']['value'],
                label: result['predicate']['value'].split('/').pop()
            }
        });
    });
    //*/

    return elements;
  }
}
