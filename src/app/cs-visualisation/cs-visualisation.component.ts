import { Component, ViewChild, ElementRef, OnDestroy, AfterContentInit, Inject, EventEmitter, Input, Output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SparqlService } from '../sparql-service.service';
import { HttpClientModule } from '@angular/common/http';
import { PrimeNGConfig } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuModule } from 'primeng/menu';
import { ListboxModule} from 'primeng/listbox';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AutoComplete } from 'primeng/autocomplete';
import { SpeedDialModule } from 'primeng/speeddial';
import { SelectButtonModule} from 'primeng/selectbutton';
import { RadialMenuComponent } from '../radial-menu/radial-menu.component';
import { ChipsModule} from 'primeng/chips';

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
  selector: 'app-cs-visualisation',
  standalone: true,
  imports: [ HttpClientModule, CommonModule, ContextMenuModule,
    MenuModule, ListboxModule, FormsModule, ButtonModule, PanelModule,
    AutoCompleteModule, SpeedDialModule, RadialMenuComponent, SelectButtonModule,
    ChipsModule ],
  templateUrl: './cs-visualisation.component.html',
  styleUrl: './cs-visualisation.component.css'
})



export class CSVisualisationComponent {

  @ViewChild('cy') cytoElem: ElementRef;
  @ViewChild('contextMenu') contextMenu: ElementRef;
  @ViewChild('speedMenu') speedMenu: ElementRef;
  @ViewChild('autocomplete') autocomplete: AutoComplete;
  @Output() optionSelected= new EventEmitter<string>();

  // context menu
  isContextMenuVisible:boolean=false;
  menuLeft:string;
  menuTop:string;
  menuHeight:string;

  cy: cytoscape.Core;

  radialVisible:boolean = false;

  // used for the node contextual menu showing expandable relations
  selectedConn:any[] =[];
  outconnections:any[]=[];

  // used for the node menu
  isNodeMenuVisible:boolean = true;
  nodeMenuLeft:string = '40px';
  nodeMenuTop:string = '40px';
  nodeMenuItems:any[]=[  
    { icon: 'pi pi-search', command: () =>  {this.isContextMenuVisible=true;} },
    { icon: 'pi pi-user', command: () => {this.isContextMenuVisible=true;} },
  // Add more items as needed
  ];

  // used to store autocompelte suggestions
  suggestions:any[] =[];
  selectedItem:string = '';
  autoCompleteTexts:any[]=[];

  // used for select Button
  stateOptions:any[] = [{"name":"Model", value:"Model"}, {"name":"Simulation", value:"Simulation"},{"name":"Dataset",value:"Dataset"}];
  selectValue = "Model";

  elkoptions = {
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
      'algorithm': 'stress',
      'elk.direction': 'UP',
      'elk.stress.desiredEdgeLength':'200'
    },
    priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
  };

  endpoint = 'https://semantics.istc.cnr.it/hacid/sparql';

   //----------------------------------------------------------------------------------------------------
   constructor(private primengConfig: PrimeNGConfig, private sparqlService:SparqlService)
  {

  }

  //----------------------------------------------------------------------------------------------------
  ngOnInit():void
  {

  }

  //----------------------------------------------------------------------------------------------------
  ngAfterViewInit()
  {
    // override the default on enter behaviour that hides the dropdown
    this.autocomplete.onEnterKey = (event:any)=>{ };
    this.initCharts([]);
    console.log(" Speed dial "+ this.speedMenu);
  }

  //----------------------------------------------------------------------------------------------------
  protected initCharts(elements: cytoscape.ElementDefinition[]) {
    console.log("Initializing charts....."+elements+"   ");

    cytoscape.use(elk);  

    //******* Initialize cytoscape *******
    this.cy = cytoscape({
      container: this.cytoElem.nativeElement,
      elements:elements,
      style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': '#94b',//#29a
                'label': 'data(label)',
                'text-outline-color':'#fff',
                'text-outline-width':'0.7',
                'color':'#444',
                'font-weight':'bold',
                'font-family':'serif',
                'border-style':'solid',
                'border-width':'1.5',
                "border-color":'#427',//#267
                'text-margin-y':-5,
                'text-wrap':'wrap',
                'text-max-width':'200'
            }
        },

        {
            selector: 'edge',
            style: {
                'width': 3.5,
                'line-color': '#555',
                'target-arrow-color': '#555',
                'target-arrow-shape': 'triangle',
                'arrow-scale':1.5,
                'curve-style':'straight',
                'font-size':'15px',
                'font-style':'italic',
                'color':'#888',
                'label': 'data(label)',
                'text-rotation': 'autorotate',
                'text-valign':'top',
                'text-margin-y':-8,
            }
        },

      ],

      layout: this.elkoptions , 
      wheelSensitivity:0.2
    });


    this.cy.on('tap','node', this.onNodeSelected1.bind(this));  // bind(this) is important because give the context to the callback function
    this.cy.on('cxttap', 'node', this.onRightMouseClick.bind(this));
    this.cy.on('mouseover', this.onMouseOver.bind(this));
    this.cy.on('mouseout', this.onMouseOut.bind(this));
    this.cy.on('tap', this.onTappingGeneral.bind(this));
    this.cy.maxZoom(2);
    /*
    this.cy.add({data:{id:"Disorder",label:"Disorder"}});
    this.cy.center();
    this.cy.zoom(1);
    //*/
  }

  //----------------------------------------------------------------------------------------------------
  primeMouseEnter()
  {
    console.log(" MOUSE enter ");
  }

  //----------------------------------------------------------------------------------------------------
  buttonSelectClick(){
    console.log("Button Selected Option "+this.selectValue);
  }
 
  onBlur(event:any)
  {
    console.log(" Blurred ///////////////");
  }

  onFocus()
  {
    console.log(" Focused");
  }
  
  //----------------------------------------------------------------------------------------------------
  onSelectClass(event)
  {
    //console.log(" Disorder: "+event.value['name']+'  uri:'+event.value['uri']);

    // we query for all disorder description and find all types of disorder description elements
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT distinct ?pred  ?predLabel  
      WHERE {
        <`+ event.value['uri'] +`> ?pred ?obj .
        ?pred rdfs:label ?predLabel .
        FILTER(lang(?predLabel) = "en-gb" || lang(?predLabel)="en" || lang(?predLabel)="en-us") .
        FILTER(?pred != rdf:type) .
      }`;

    
    this.sparqlService.querySparqlEndpoint(this.endpoint, query )
      .subscribe({
        next: (data) => this.addClass(data, event.value),
        error: (error)=> console.error('There was an error!', error)
      });
  }

  //----------------------------------------------------------------------------------------------------
  addClass(Results:SparqlResponse, classInstance:any)
  {
    console.log(" Class: "+classInstance['name']+'  uri:'+classInstance['uri']);

    let relations:any[]=[]
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      var value:string = result['predLabel']['value'];
      console.log(value);
      relations.push({ "name": value, "uri":result['pred']['value']});
    } );

    this.cy.add({data:{id: classInstance['uri'],label:classInstance['name'], relationItems:relations, tagged:false }});
    this.cy.center();
    this.cy.zoom(2);
    var layout = this.cy.layout({
      name: 'elk' // You can use any layout algorithm here
    });
    
    this.cy.layout(this.elkoptions).run();
    this.cy.center();
    this.cy.zoom(-2);
  }

  //----------------------------------------------------------------------------------------------------
  onNodeSelected1(evt)
  {
    var node=evt.target;

    this.outconnections = [];

    if(node!== this.cy)
    {
      if(node.data('descriptionItems')!=undefined)
      {
        this.outconnections=node.data('descriptionItems');
        this.isContextMenuVisible = true;
        this.menuLeft = node.renderedPosition('x')+'px';    
       this.menuTop = node.renderedPosition('y')+'px';
       this.menuHeight = 24+ 46*4+'px';
      }
      else
      {
        console.log(" node id="+node.id());
        const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT distinct ?pred  ?predLabel  
        WHERE {
          <`+ node.id() +`> <https://w3id.org/hacid/onto/mdx/isDescribedBy> ?description .
          ?description ?pred ?obj .
          ?pred rdfs:label ?predLabel .
          FILTER(lang(?predLabel) = "en-gb" || lang(?predLabel)="en" || lang(?predLabel)="en-us") .
          FILTER(?pred != rdf:type) .
        }`;
  
      
      this.sparqlService.querySparqlEndpoint(this.endpoint, query )
        .subscribe({
          next: (data) => this.onNodeSelectedFirstTime(data, node.id()),
          error: (error)=> console.error('There was an error!', error)
        });
      }
    }
  }

  onNodeSelectedFirstTime(Results:SparqlResponse, disorder:any )
  {    
    let descrItems:any[]=[]
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      var value:string = result['predLabel']['value'];
      console.log(value);
      descrItems.push({ "name": value, "uri":result['pred']['value']});
    } );
    
    var node =this.cy.getElementById(disorder);
    node.data().descriptionItems = descrItems;
    this.outconnections = [];
    this.outconnections=node.data('descriptionItems');
    this.isContextMenuVisible = true;
    this.menuLeft = node.renderedPosition('x')+'px';    
    this.menuTop = node.renderedPosition('y')+'px';
    this.menuHeight = 24+ 46*4+'px';
  }

  //----------------------------------------------------------------------------------------------------
  onKeyUp(event: KeyboardEvent)
  {

    if (event.key == "Enter" )
    {
     let tokenInput = event.target as HTMLInputElement;

     if (tokenInput.value) {
      this.autoCompleteTexts.push({"name":tokenInput.value});
      tokenInput.value = "";
     }
     console.log("hello");
     this.autocomplete.show();
    }

  }
  //----------------------------------------------------------------------------------------------------
  // Called when in the autocomplete box user unselect one chip
  onUnselect(event:any)
  {
    console.log("unselect");
    this.autocomplete.hide();

    //this.autocomplete.search({query:""}, "", this.search);

  }

  //----------------------------------------------------------------------------------------------------
   search(event)
  {
    var containList:string[]=[];
    containList.push(event.query);

    if(this.autoCompleteTexts)
    this.autoCompleteTexts.forEach(elem=>{ containList.push(elem.name)});
 

    this.sparqlService.findClassInstancesURIs(this.endpoint,
                "<https://w3id.org/hacid/onto/ccso/"+this.selectValue+">", 
                containList )
      .subscribe({
        next: (data) => this.searchResults(data),
        error: (error)=> console.error('There was an error!', error)
      });      
  }

  //----------------------------------------------------------------------------------------------------
  searchResults(Results:SparqlResponse)
  {
    let suggestions:any[]=[]
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      var value:string = result['classInstance']['value'];
      suggestions.push({ "name": value.split('/').pop(), "uri":result['classInstance']['value']});
    } );

    // loading wheel of the search box will only disappear if suggestions array is assigned a compleately new one. It doesn't work to empty it and add elements.
    this.suggestions = suggestions;
  }
  //

  //----------------------------------------------------------------------------------------------------
  onTappingGeneral(evt)
  {
    if(evt.target==this.cy)
      this.isContextMenuVisible=false;
  }

  //----------------------------------------------------------------------------------------------------
  onExpand()
  {
    console.log(" Expand:"+this.cy.$(':selected').data('id'));
    this.selectedConn.forEach( el=>{
      console.log(' '+el['uri']);
    });

    var query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT distinct ?pred  ?predLabel  ?obj ?objLabel
      WHERE {
        <`+this.cy.$(':selected').data('id')+`> <https://w3id.org/hacid/onto/mdx/isDescribedBy> ?description .
        ?description ?pred ?obj .
        ?pred rdfs:label ?predLabel .
        ?obj rdfs:label ?objLabel .
        FILTER(lang(?predLabel) = "en-gb" || lang(?predLabel)="en" ) .
        FILTER(lang(?objLabel) = "en-gb" || lang(?objLabel)="en" ) .
        FILTER(?pred != rdf:type) .`;
    
    if(this.selectedConn.length>0)
    {
      query+= ' FILTER(';

      this.selectedConn.forEach(el=>{
          query+=' ?pred=<'+ el['uri'] + '>';
          if(el!=this.selectedConn[this.selectedConn.length-1])
            query+=' || ';
      });
    
      query+= ') .';
    }

    query+='}';

    console.log(" Query="+ query);
    
    this.sparqlService.querySparqlEndpoint(this.endpoint, query )
      .subscribe({
        next: (data) => this.onNodeExpanded(data),
        error: (error)=> console.error('There was an error!', error)
      });

      this.isContextMenuVisible = false;
  }

  //----------------------------------------------------------------------------------------------------
  onNodeExpanded(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      if(this.cy.getElementById(result['obj']['value']).length==0)
         this.cy.add({data:{id:result['obj']['value'],label:result['objLabel']['value'], tagged:false}})
        .style({'shape':'barrel', 'background-color':'#aac'});
      
      if(this.cy.getElementById(this.cy.$(':selected').data('id')+result['pred']['value']+ result['obj']['value']).length==0)
        this.cy.add({data:{id:this.cy.$(':selected').data('id')+result['pred']['value']+ result['obj']['value'],
            source:this.cy.$(':selected').data('id'),
            target:result['obj']['value'],
            label:result['predLabel']['value']
            }}).style({'width':'1'});
    } );

    this.cy.layout(this.elkoptions).run();
  }

  //----------------------------------------------------------------------------------------------------
  onBroader()
  {
    var query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT distinct ?obj ?objLabel
    WHERE {
      <`+this.cy.$(':selected').data('id')+`> <https://w3id.org/hacid/onto/mdx/broader>  ?obj .
      ?obj rdfs:label ?objLabel .
      FILTER(lang(?objLabel) = "en-gb" || lang(?objLabel)="en" ) .
    }`;

    this.sparqlService.querySparqlEndpoint(this.endpoint, query )
      .subscribe({
        next: (data) => this.onBroaderResult(data),
        error: (error)=> console.error('There was an error!', error)
      });
    this.isContextMenuVisible=false;
  }

  //----------------------------------------------------------------------------------------------------
  onBroaderResult(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      // Add node if it doesn't alrady exist
      if( this.cy.getElementById(result['obj']['value']).length==0)
        this.cy.add({data:{id:result['obj']['value'],label:result['objLabel']['value'], tagged:false}});

      if( this.cy.getElementById(this.cy.$(':selected').data('id')+'broader'+ result['obj']['value']).length==0)
      this.cy.add({data:{id:this.cy.$(':selected').data('id')+'broader'+ result['obj']['value'],
            source:this.cy.$(':selected').data('id'),
            target:result['obj']['value'],
            label:'broader'
            }});
    } );

    this.cy.layout(this.elkoptions).run();
  }

  //----------------------------------------------------------------------------------------------------
  onNarrower()
  {
    var query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT distinct ?obj ?objLabel
    WHERE {
      ?obj <https://w3id.org/hacid/onto/mdx/broader>  <`+this.cy.$(':selected').data('id')+`> .
      ?obj rdfs:label ?objLabel .
      FILTER(lang(?objLabel) = "en-gb" || lang(?objLabel)="en" ) .
    }`;
    this.sparqlService.querySparqlEndpoint(this.endpoint, query )
      .subscribe({
        next: (data) => this.onNarrowerResult(data),
        error: (error)=> console.error('There was an error!', error)
      });
      this.isContextMenuVisible = false;
  }

  //----------------------------------------------------------------------------------------------------
  onNarrowerResult(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
       // Add node if it doesn't alrady exist
       if( this.cy.getElementById(result['obj']['value']).length==0)
        this.cy.add({data:{id:result['obj']['value'],label:result['objLabel']['value'], tagged:false}});

       if( this.cy.getElementById(result['obj']['value']+'broader'+ this.cy.$(':selected').data('id')).length==0)
        this.cy.add({data:{id: result['obj']['value']+'broader'+ this.cy.$(':selected').data('id'),
            source:result['obj']['value'],
            target:this.cy.$(':selected').data('id'),
            label:'broader'
            }});
    } );

    this.cy.layout(this.elkoptions).run();
  }



  //----------------------------------------------------------------------------------------------------
  onRightMouseClick(evt)
  {

    console.log("right click")
    if(!evt.target.data('tagged'))
      evt.target.style({'outline-width':'4','outline-offset':'8','outline-color':'#c08'});
    else
      evt.target.style({'outline-width':'0','outline-offset':'4','outline-color':'#0cc'});
    evt.target.data('tagged', !evt.target.data('tagged'));
  }

  //----------------------------------------------------------------------------------------------------
  onMouseOver(evt)
  {
    var node=evt.target;
      
    /*
    if(  node.data && 'id' in node.data())
    {
      console.log(" inside ");
     // node.data('label',node.data('longlabel') )
     // this.nodeMenuLeft = node.renderedPosition('x')-10+'px';    
      //this.nodeMenuTop = node.renderedPosition('y')+-10+'px';
     // this.isNodeMenuVisible=true;
      this.speedMenu.nativeElement.toggle();
    }
  */
  }

  //----------------------------------------------------------------------------------------------------
  onMouseOut(evt)
  {
    var node=evt.target;
    //console.log("mouseout");
    node.data('label',node.data('shortlabel') )
    //this.isNodeMenuVisible = false;
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
