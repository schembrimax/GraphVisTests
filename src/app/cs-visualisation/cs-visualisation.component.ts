import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, AfterContentInit,
   Inject, EventEmitter, Input, Output, viewChild } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import { firstValueFrom } from 'rxjs';

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



export class CSVisualisationComponent
{

  @ViewChild('cy') cytoElem: ElementRef;
  @ViewChild('contextMenu',{static:false}) contextMenu: ElementRef;
  //@ViewChild('speedMenu') speedMenu: ElementRef;
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
  selectedExpRel:any[] =[];
  expandableRelations:any[]=[];

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
      'elk.stress.desiredEdgeLength':'150'
    },
    priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
  };

  nodeStyels={
    "Default": {
      'background-color': '#c3e0d9',//#29a
      'background-fit':'contain', 
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'width':'20',
      'height':'20',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'font-size':'10',
      'border-style':'solid',
      "border-color":'#505957',//#267
      }
    ,
    "Simulation": {
      'background-color': '#FFF463',//#29a
      'background-image':'assets/simulation.png',
      'background-fit':'contain', 
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#908709',//#267
      }
    ,
    "Model": {
      'background-color': '#71E5EB',//#29a
      'background-image':'assets/model.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#1A7F96',//#267
      }
    ,
    "Dataset": {
      'background-color': '#EFB0EF',//#29a
      'background-image':'assets/dataset.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-size':'10',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#8C1F76',//#267
      }
    ,
    "Organisation": {
      'background-color': '#37DFAE',//#29a
      'background-image':'assets/organisation.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#3AA186',//#267
      }
    ,
    "SpatialRegion": {
      'background-color': '#7CEB89',//#29a
      'background-image':'assets/spatial-region.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#388138',//#267
      }
    ,
    "TimeInterval": {
      'background-color': '#B9C0FF',//#29a
      'background-image':'assets/time-interval.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#525DB1',//#267
      }
    ,
    "Variable": {
      'background-color': '#CEF0EF',//#29a
      'background-image':'assets/variable.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#4F4F4F',//#267
     }
    ,
    "GreenhouseGasConcentrationPathway": {
      'background-color': '#FD5A56',//#29a
      'background-image':'assets/ggcp-scenario.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#7D110F',//#267
     }
    ,
    "TimeDuration": {
      'background-color': '#FDC453',//#29a
      'background-image':'assets/time-duration.png',
      'background-fit':'contain',
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'border-style':'solid',
      "border-color":'#684726',//#267

     }
 

    }

  endpoint = 'https://semantics.istc.cnr.it/hacid/sparql';

   //----------------------------------------------------------------------------------------------------
   constructor(private primengConfig: PrimeNGConfig, private sparqlService:SparqlService, private changeDetectorRef:ChangeDetectorRef)
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
    this.initialise([]);

  }

  //----------------------------------------------------------------------------------------------------
  protected initialise(elements: cytoscape.ElementDefinition[])
  {
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
                'background-color': '#fff',//#29a
                'background-fit':'contain',
                'background-position-x':'50%',
                'background-position-y':'50%',
                'label': 'data(label)',
                'text-outline-color':'#fff',
                'text-outline-width':'0.7',
                'color':'#444',
                'font-size':'12',
                'min-zoomed-font-size':20,
                'font-weight':'bold',
                'font-family':'serif',
                'border-style':'solid',
                'border-width':'1.5',
                "border-color":'#00b359',//#267
                'text-margin-y':-5,
                'text-wrap':'wrap',
                'text-max-width':'150px'
            }
        },

        {
            selector: 'edge',
            style: {
                'width': 3.5,
                'line-color': '#555',
                'target-arrow-color': '#555',
                'target-arrow-shape': 'triangle',
                'arrow-scale':1.0,
                'curve-style':'straight',
                'font-size':'10px',
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

    this.cy.on('tap','node', this.onNodeSelected.bind(this));  // bind(this) is important because give the context to the callback function
    this.cy.on('cxttap', 'node', this.onRightMouseClick.bind(this));
    this.cy.on('mouseover', this.onMouseOver.bind(this));
    this.cy.on('mouseout', this.onMouseOut.bind(this));
    this.cy.on('tap', this.onTappingGeneral.bind(this));
    this.cy.maxZoom(2);
    
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
  
  //----------------------------------------------------------------------------------------------------
  primeMouseEnter()
  {
    console.log(" MOUSE enter ");
  }

  //----------------------------------------------------------------------------------------------------
  buttonSelectClick(){
    console.log(" Button Selected Option "+this.selectValue);
  }
 
  onBlur(event:any)
  {
    console.log(" Blurred ");
  }

  onFocus()
  {
    console.log(" Focused ");
  }
  
  //----------------------------------------------------------------------------------------------------
  /*         An element has been selected from the dropdown list of the search box
   */
  onSelectClass(event)
  {
    //console.log(" Disorder: "+event.value['name']+'  uri:'+event.value['uri']);
    this.addInstance(event);
    this.autoCompleteTexts.pop();
 
  }
 
  /*----------------------------------------------------------------------------------------------------
   *  Add a node instance to the graph based on the selected knowledge graph instance
   *  Each cytoscape node added has the following data associated with it
   *  - id: the node id
   *  - label: the node label is what is visualized in the interface
   *  - tagged: a boolean indicating the tagging status of the node
   *  - 
   */

  addInstance( kg_instance)
  {

    if(this.cy.getElementById(kg_instance.value['uri']).length==0)
    {
      this.cy.add({data:{ 
        id: kg_instance.value['uri'],
        label:kg_instance.value['name'].replace(/\./g, '.\u200b')+"\n("+this.selectValue+")",
        dirRels:undefined,
        invRels:undefined,
        tagged:false,

        }
      }).style(this.nodeStyels[this.selectValue]);

      this.cy.center();
      this.cy.zoom(2);

      //var layout = this.cy.layout({
      //  name: 'elk' // You can use any layout algorithm here
      //});

      this.cy.layout(this.elkoptions).run();
    }
  }

  //----------------------------------------------------------------------------------------------------
  onNodeSelected(evt)
  {
    var node=evt.target;

    this.expandableRelations = [];
    this.selectedExpRel = []; // reset selected connetions

    if(node!== this.cy)
    {
      if( node.data('dirRels')==undefined )
      {
        this.addExpandableRelations(
              node.data('id'),
              ()=>{
                this.expandableRelations = node.data('dirRels')?.slice().concat(node.data('invRels')?.slice()  );
                this.showContextMenu(node.renderedPosition('x'), node.renderedPosition('y'));         
        });
      }
      else
      {
        this.expandableRelations = node.data('dirRels')?.slice().concat(node.data('invRels')?.slice()  );
        this.showContextMenu(node.renderedPosition('x'), node.renderedPosition('y'));
      }

    }
  }
  //----------------------------------------------------------------------------------------------------

  showContextMenu(posx, posy)
  {
    this.isContextMenuVisible = true;
    this.changeDetectorRef.detectChanges();

    var new_posy = (posy + this.contextMenu.nativeElement.offsetHeight) > this.cytoElem.nativeElement.offsetHeight ?
            (this.cytoElem.nativeElement.offsetHeight-this.contextMenu.nativeElement.offsetHeight) : posy;
    var new_posx = (posx + this.contextMenu.nativeElement.offsetWidth) > this.cytoElem.nativeElement.offsetWidth ?
            (this.cytoElem.nativeElement.offsetWidth-this.contextMenu.nativeElement.offsetWidth) : posx;
    new_posx = (new_posx < posx && new_posy <posy) ? posx - this.contextMenu.nativeElement.offsetWidth : new_posx;

    this.menuLeft = new_posx+'px';    
    this.menuTop = new_posy+'px';
    this.menuHeight = 24+ 46*4+'px';
  }

  //----------------------------------------------------------------------------------------------------
  // Add the list of expanable relations of the node
  //----------------------------------------------------------------------------------------------------
  addExpandableRelations( instance, callback )
  {
    //console.log(" instance: "+instance.value['name']+'  uri:'+instance.value['uri']);

    // we query for all direct relations types of the node
    const queryDirectRel = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT distinct ?pred
    WHERE {
      <`+ instance +`> ?pred ?obj .
      FILTER(?pred != rdf:type) .
      FILTER(?pred != rdfs:label) .
    }`;

    // we query for all inverse relations types of the node
    const queryInverseRel = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
   
    SELECT distinct ?pred   
    WHERE {
     ?obj ?pred <`+ instance +`>.
     FILTER(?pred != rdf:type) .
     FILTER(?pred != rdfs:label) .
    }`;

    // we execute two sparql query in parallel and get the results when subscribe
    forkJoin({
        directRels:this.sparqlService.querySparqlEndpoint(this.endpoint, queryDirectRel ),
        inverseRels:this.sparqlService.querySparqlEndpoint(this.endpoint, queryInverseRel )
      }).subscribe({
        next: (data) =>{
          console.log(" Class:  uri:"+instance);

          let directRelations:any[]=[]
          let inverseRelations:any[]=[]

          data.directRels.results.bindings.forEach(result => {
            console.log(" dRel : "+ result['pred']['value'])
            directRelations.push({  "name": "-> " + result['pred']['value'].split('/').pop(),
                                    "uri":result['pred']['value'],
                                    "direct":true,
                                    "expanded":false
                                  });
          } );

          data.inverseRels.results.bindings.forEach(result => {
            console.log(" iRel : "+ result['pred']['value'])
            inverseRelations.push({ "name": "<- " + result['pred']['value'].split('/').pop(),
                                    "uri":result['pred']['value'],
                                    "direct":false,
                                    "expanded":false
                                  });
          } );

          this.cy.getElementById(instance).data('dirRels',directRelations);
          this.cy.getElementById(instance).data('invRels',inverseRelations);
          callback();
        },
        error: (error)=> console.error('There was an error!', error)
    });
  }

  //----------------------------------------------------------------------------------------------------
  onKeyUp(event: KeyboardEvent)
  {
    if (event.key == "Enter" )
    {
     let tokenInput = event.target as HTMLInputElement;

     if (tokenInput.value) {
      if(this.autoCompleteTexts==null)
        this.autoCompleteTexts = [];
      this.autoCompleteTexts.push({"name":tokenInput.value});
      tokenInput.value = "";
     }
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
  onTappingGeneral(evt)
  {
    if(evt.target==this.cy)
    {
      this.isContextMenuVisible=false;
      this.autocomplete.clear();
    }
  }

  /*----------------------------------------------------------------------------------------------------
   *  Expands selected relations listed in the selectedExpRel array 
   */
  onExpand()
  {
    var directRel:any[] = [];
    var inverseRel:any[] = [];

    console.log(" Expand:"+this.cy.$(':selected').data('id'));

    this.selectedExpRel.forEach( el=>{
      if(el['direct'])
        directRel.push(el);
      else
        inverseRel.push(el)
    });

    directRel.forEach(element => {
       console.log(' dr:  '+element['name'])
    });

    inverseRel.forEach(element => {
      console.log(' ir:  '+element['name'])
   });

   //*****************************************************************/
    var queryDirectRels = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT distinct ?pred ?obj ?objType
      WHERE {
        <`+this.cy.$(':selected').data('id')+`> ?pred ?obj .
        OPTIONAL{ ?obj rdf:type ?objType }.
        FILTER(?pred != rdf:type) .
        FILTER(?pred != rdfs:label) .`
        ;
    
    if(directRel.length>0)
    {
      queryDirectRels+= ' FILTER(';

      directRel.forEach(el=>{
        queryDirectRels+=' ?pred=<'+ el['uri'] + '>';
          if(el!=directRel[directRel.length-1])
            queryDirectRels+=' || ';
      });
    
      queryDirectRels+= ') .';
    }

    queryDirectRels+='} LIMIT 20';

    console.log(" Query="+ queryDirectRels);


    //*****************************************************************/
    var queryInverseRels = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT distinct ?pred ?obj ?objType
    WHERE {
      ?obj ?pred <`+this.cy.$(':selected').data('id')+`> .
      OPTIONAL{ ?obj rdf:type ?objType }.
      FILTER(?pred != rdf:type) .
      FILTER(?pred != rdfs:label) .`
      ;
 
    if(inverseRel.length>0)
    {
      queryInverseRels+= ' FILTER(';

      inverseRel.forEach(el=>{
        queryInverseRels+=' ?pred=<'+ el['uri'] + '>';
          if(el!=inverseRel[inverseRel.length-1])
            queryInverseRels+=' || ';
      });
    
      queryInverseRels+= ') .';
    }

    queryInverseRels+='} LIMIT 20';

    console.log(" Query="+ queryInverseRels);

    if(directRel.length>0)
      this.sparqlService.querySparqlEndpoint(this.endpoint, queryDirectRels )
        .subscribe({
          next: (data) => this.onNodeExpandDirect(data),
          error: (error)=> console.error('There was an error!', error)
        });

    if(inverseRel.length>0)
      this.sparqlService.querySparqlEndpoint(this.endpoint, queryInverseRels )
      .subscribe({
        next: (data) => this.onNodeExpandInverse(data),
        error: (error)=> console.error('There was an error!', error)
      });

    this.isContextMenuVisible = false;
  }

  //----------------------------------------------------------------------------------------------------
  onNodeExpandDirect(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      if(this.cy.getElementById(result['obj']['value']).length==0)
      {
        if( result['objType'] == undefined)
          result['objType']={'type':'uri','value':'default'};
        var splitUri:string[] =[];
        var splitType:string[] =[];
        splitUri = result['obj']['value'].split('/');
         this.cy.add({data:{id:result['obj']['value'], label:splitUri.pop()!.replace(/\./g, '.\u200b')+"\n("+splitUri.pop()+")", tagged:false}})
      .style( (this.nodeStyels[result['objType']['value'].split('/').pop()!] || this.nodeStyels["Default"]) );
 //      .style({'shape':'barrel', 'background-color':'#aac','text-wrap':'wrap'});
      }

      if(this.cy.getElementById(this.cy.$(':selected').data('id')+result['pred']['value']+ result['obj']['value']).length==0)
        this.cy.add({data:{id:this.cy.$(':selected').data('id')+result['pred']['value']+ result['obj']['value'],
            source:this.cy.$(':selected').data('id'),
            target:result['obj']['value'],
            label:result['pred']['value'].split('/').pop()
            }}).style({'width':'1'});
    } );

    this.cy.center();
    this.cy.zoom(2);
    this.cy.layout(this.elkoptions).run();
  }

  //----------------------------------------------------------------------------------------------------
  onNodeExpandInverse(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    sparqlResults.forEach(result => {
      // Add nodes for subject and object
      if(this.cy.getElementById(result['obj']['value']).length==0)
      {
        if( result['objType'] == undefined)
          result['objType']={'type':'uri','value':'default'};
        var splitUri:string[] =[];
        splitUri = result['obj']['value'].split('/');
         this.cy.add({data:{id:result['obj']['value'], label:splitUri.pop()!.replace(/\./g, '.\u200b')+"\n("+splitUri.pop()+")", tagged:false}})
        .style( (this.nodeStyels[result['objType']['value'].split('/').pop()!] || this.nodeStyels["Default"]) );
      //  .style({'shape':'barrel', 'background-color':'#aac'});
      }

      if(this.cy.getElementById(result['obj']['value'] + result['pred']['value'] + this.cy.$(':selected').data('id') ).length==0)
        this.cy.add({data:{id:result['obj']['value'] + result['pred']['value'] + this.cy.$(':selected').data('id'),
            source:result['obj']['value'],
            target:this.cy.$(':selected').data('id'),
            label:result['pred']['value'].split('/').pop()
            }}).style({'width':'1'});
    } );

    this.cy.center();
    this.cy.zoom(2);
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

  //----------------------------------------------------------------------------------------------------
}
