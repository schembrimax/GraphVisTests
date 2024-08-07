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
import { TooltipModule } from 'primeng/tooltip';
import { ChipsModule} from 'primeng/chips';
import { SplitterModule } from 'primeng/splitter';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule} from 'primeng/toast'
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import * as classTooltipDataJson from '../../assets/classTooltipData.json';


import cytoscape, { BaseLayoutOptions } from 'cytoscape';
import cola from 'cytoscape-cola';
import elk from 'cytoscape-elk';
import { MenuItem } from 'primeng/api';
import { elementAt, forkJoin } from 'rxjs';
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
    ChipsModule, TooltipModule, SplitterModule, ConfirmDialogModule, ToastModule,
     ProgressSpinnerModule],
  templateUrl: './cs-visualisation.component.html',
  styleUrl: './cs-visualisation.component.css',
  providers:[MessageService]
})

export class CSVisualisationComponent
{
  @ViewChild('cy') cytoElem: ElementRef;
  @ViewChild('contextMenu',{static:false}) contextMenu: ElementRef;
  //@ViewChild('speedMenu') speedMenu: ElementRef;
  @ViewChild('autocomplete') autocomplete: AutoComplete;
  @Output() optionSelected= new EventEmitter<string>();

  observer : IntersectionObserver;

  // context menu
  isContextMenuVisible:boolean=false;
  menuLeft :string;
  menuTop :string;
  menuHeight :string;
  contextMenuHeader :string;
  currentContextNode :any;

  cy: cytoscape.Core;

  classTooltipData:any = classTooltipDataJson;
  items = [
    { label: 'Item 1', value: '1', tooltip: 'Tooltip for Item 1' },
    { label: 'Item 2', value: '2', tooltip: 'Tooltip for Item 2' },
    { label: 'Item 3', value: '3', tooltip: 'Tooltip for Item 3' }
  ];


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

  // loading wheel
  isLoadingWheelVisible=false;
  loadingWheelTop = '40px';
  loadingWheelLeft = '40px';


  // used to store autocompelte suggestions
  suggestions:any[] =[];
  selectedItem:string = '';
  autoCompleteTexts:any[]=[];

  // multiple relation search
  multiRelSearch = false;

  // list of tagged nodes
  taggedNodes:any[] = [];

  // used for select Button
  stateOptions:any[] = [{"name":"Model", value:"Model"},
                        {"name":"Simulation", value:"Simulation"},
                        {"name":"Dataset",value:"Dataset"},
                        {"name":"Organisation",value:"Organisation"},
                        {"name":"GGCP Scenario",value:"GreenhouseGasConcentrationPathway"},
                        {"name":"Spatial Region",value:"SpatialRegion"},
                        {"name":"Time Duration",value:"TimeDuration"},
                        {"name":"Time Interval",value:"TimeInterval"},
                        {"name":"Variable",value:"Variable"},];
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
    "NodeGroup": {
      //'background-color': '#c3e0d9',//#29a
      'background-image':'assets/NodeGroupIcon.png',
      'background-opacity':0,
      'background-fit':'contain', 
      'label': 'data(label)',
      'text-outline-color':'#fff',
      'text-outline-width':'0.7',
      'width':'55',
      'height':'55',
      'color':'#444',
      'font-weight':'bold',
      'font-family':'serif',
      'font-size':'10',
     // 'border-style':'solid',
     // "border-color":'#505957',//#267
      "border-width":0
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
   constructor( private primengConfig: PrimeNGConfig,
                private sparqlService:SparqlService,
                private changeDetectorRef:ChangeDetectorRef,
                private messageService:MessageService)
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

    this.stateOptions = this.classTooltipData["stateOptions"];
    console.log(" test json ="+ this.classTooltipData[this.stateOptions[0].name])

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Component is visible in the viewport');
          this.isLoadingWheelVisible = false;
        }
      });
    });

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

    // Following lines define what happens when we interact with nodes and in particula

    // right mouse button click, also called context tap
    this.cy.on('cxttap','node', this.onContextTap.bind(this));  // bind(this) is important because give the context to the callback function

    // left mouse button click, also called tap
    this.cy.on('tap', 'node', this.onTap.bind(this));

    this.cy.on('mouseover', this.onMouseOver.bind(this));
    this.cy.on('mouseout', this.onMouseOut.bind(this));
    this.cy.on('tap', this.onTappingGeneral.bind(this));
    this.cy.on('cxttap',this.onTappingGeneral.bind(this));
    this.cy.maxZoom(2);    
  }

  //----------------------------------------------------------------------------------------------------
  search(event)
  {
    var containList:string[]=[];
    containList.push(event.query);

    if(this.autoCompleteTexts)
      this.autoCompleteTexts.forEach(elem=>{ containList.push(elem.name)});
  
    var prefix = this.selectValue =="Organisation" || this.selectValue =="TimeInterval" ? "<https://w3id.org/hacid/onto/top-level/":"<https://w3id.org/hacid/onto/ccso/";
    var classURI = prefix +this.selectValue+">";

    this.sparqlService.findClassInstances(this.endpoint,
                classURI,
                "", 
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
      var value:string = result['classInstanceLabel']['value'];
      suggestions.push({ "name": value, "uri":result['classInstance']['value']});
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
  /*     Called when an element has been selected from the dropdown list of the search box
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
   *  - type: type of node. At the moment can be simple or group
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
        type:'simple'

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

  /*----------------------------------------------------------------------------------------------------
    Right mouse button click.
    This action show the context menu with all the relations of a node.
    Relations can be selected and expanded with the "expand" button
    Clicking the expand button will call the onExpand() function
  */
  onContextTap(evt)
  {

    var node=evt.target;

    this.expandableRelations = [];
    this.selectedExpRel = []; // reset selected connetions

    if(node!== this.cy)
    {
      this.currentContextNode = node;
      if(this.currentContextNode.data('type')=='simple')
      {
        this.contextMenuHeader = '\u{1F517} '+ (node.data('label').length >25 ? node.data('label').substring(0,25)+"...": node.data('label'));
        if( node.data('dirRels')==undefined )
        {
          this.addExpandableRelations(
                node.data('id'),
                ()=>{
                  this.expandableRelations = node.data('dirRels')?.slice().concat(node.data('invRels')?.slice()  );
                  this.showNodeRelationsCtxMenu(node.renderedPosition('x'), node.renderedPosition('y'));         
          });
        }
        else
        {
          this.expandableRelations = node.data('dirRels')?.slice().concat(node.data('invRels')?.slice()  );
          this.showNodeRelationsCtxMenu(evt.originalEvent.offsetX , evt.originalEvent.offsetY);
        }
      }
      // Group node contex menu visualisation
      else
      {
        this.showNodeRelationsCtxMenu(evt.originalEvent.offsetX , evt.originalEvent.offsetY);

        let relations:any[]=[]
        node.data('data').forEach(element => {
          relations.push({  "name":  element['obj']['value'],
            "uri":element['pred']['value'],
            "direct":true,
            "expanded":false
          });
        });
        this.expandableRelations = relations
      }
    }
  }

  //----------------------------------------------------------------------------------------------------

  showNodeRelationsCtxMenu(posx, posy)
  {
    this.isContextMenuVisible = true;
    //makes the context menu visible immediately by forcing change detection
    this.changeDetectorRef.detectChanges();

    var new_posy = (posy + this.contextMenu.nativeElement.offsetHeight) > this.cytoElem.nativeElement.offsetHeight ?
                    (this.cytoElem.nativeElement.offsetHeight-this.contextMenu.nativeElement.offsetHeight-10) : posy+10;

    var new_posx = (posx + this.contextMenu.nativeElement.offsetWidth) > this.cytoElem.nativeElement.offsetWidth ?
                    (this.cytoElem.nativeElement.offsetWidth-this.contextMenu.nativeElement.offsetWidth-10) : posx+10;

    new_posx = (new_posx < posx && new_posy <posy) ? posx - this.contextMenu.nativeElement.offsetWidth : new_posx;

    this.menuLeft = new_posx+'px';    
    this.menuTop = new_posy+'px';
    this.menuHeight = 24+ 46*4+'px';
//    this.isLoadingWheelVisible=true;
//    this.loadingWheelLeft = this.menuLeft;
//    this.loadingWheelTop = this.menuTop;

  }

  //----------------------------------------------------------------------------------------------------

  onContextHeaderClick()
  {
    window.open( this.currentContextNode.data('id'), '_blank');
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
    
    SELECT distinct ?pred ?objType
    WHERE {
      <`+ instance +`> ?pred ?obj .
      OPTIONAL{?obj rdf:type ?objType} .
      FILTER(?pred != rdf:type) .
      FILTER(?pred != rdfs:label) .
    }`;

    // we query for all inverse relations types of the node
    const queryInverseRel = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
   
    SELECT distinct ?pred ?objType
    WHERE {
     ?obj ?pred <`+ instance +`>.
     OPTIONAL{?obj rdf:type ?objType} .
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
            console.log(" dRel : "+ result['pred']['value']);
            var objType = ""
            var objTypeValue = ""
            
            if(result['objType']!==undefined)
            {
              objTypeValue = result['objType']['value'] ;
              objType ="("+ objTypeValue.split('/').pop()+")";
            }

            directRelations.push({  "name": "-> " + result['pred']['value'].split('/').pop()+objType,
                                    "uri":result['pred']['value'],
                                    "direct":true,
                                    "expanded":false,
                                    "targetType":objTypeValue
                                  });
          } );

          data.inverseRels.results.bindings.forEach(result => {
            console.log(" iRel : "+ result['pred']['value'])
            var objType = ""
            var objTypeValue = ""
            
            if(result['objType']!==undefined)
            {
              objTypeValue = result['objType']['value'] ;
              objType =" ("+ objTypeValue.split('/').pop()+")";
            }

            inverseRelations.push({ "name": "<- " + result['pred']['value'].split('/').pop()+objType,
                                    "uri":result['pred']['value'],
                                    "direct":false,
                                    "expanded":false,
                                    "targetType":objTypeValue
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
      this.currentContextNode = null;
      this.autocomplete.clear();
    }
  }

  /*----------------------------------------------------------------------------------------------------
   *  Expands selected relations listed in the selectedExpRel array 
   */
  onExpand()
  {
    this.isContextMenuVisible = false;  // hide context menu

    this.selectedExpRel.forEach( el=>{
      if(el['direct'])
      {
        var queryDirectRels = 
          `
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            
            SELECT distinct ?pred ?obj ?objType ?objLabel
            WHERE {
              <`+this.currentContextNode.data('id')+`> <`+ el['uri']+`> ?obj .`+
              (el['targetType']!=""?  (  ` ?obj rdf:type <`+ el['targetType']+ `>`): ``)
              +`
              OPTIONAL{?obj rdfs:label ?objLabel}.
              OPTIONAL{ ?obj rdf:type ?objType 
                        FILTER(lang(?objLabel) = "en-gb" || lang(?objLabel) = "en-us" || lang(?objLabel) = "en").}.
              BIND(  <`+el['uri'] +`> as ?pred).
              }
          `;

        this.sparqlService.querySparqlEndpoint(this.endpoint, queryDirectRels )
            .subscribe({
              next: (data) => this.onNodeExpandRelation(data,{"relation":el, "query":queryDirectRels}),
              error: (error)=> console.error('There was an error!', error)
        });
      }
      else
      {
        var queryInverseRels =
          ` 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            
            SELECT distinct ?pred ?obj ?objType ?objLabel
            WHERE {
              ?obj   <`+el['uri'] +`> <`+this.currentContextNode.data('id')+`> .`+
              (el['targetType']!=""?  (  ` ?obj rdf:type <`+ el['targetType']+`>`): ``)
              +`
              OPTIONAL{?obj rdfs:label ?objLabel}.
              OPTIONAL{ ?obj rdf:type ?objType 
                        FILTER(lang(?objLabel) = "en-gb" || lang(?objLabel) = "en-us" || lang(?objLabel) = "en").}.
              BIND(  <`+el['uri'] +`> as ?pred).
              }
          `;

        this.sparqlService.querySparqlEndpoint(this.endpoint, queryInverseRels )
            .subscribe({
              next: (data) => this.onNodeExpandRelation(data,{"relation":el,"query":queryDirectRels}),
              error: (error)=> console.error('There was an error!', error)
        });      
      }
    });
  }

  //----------------------------------------------------------------------------------------------------
  groupBy<T, K extends keyof T>(array: T[], key: K): Record<T[K] extends number | string | symbol ? T[K] : string, T[]> {
    return array.reduce((accumulator, currentValue) => {
      const groupKey = currentValue[key];
  
      // Ensure the groupKey is a valid key type (string, number, or symbol)
      const keyString = groupKey as T[K] extends number | string | symbol ? T[K] : string;
  
      // Initialize the group if it doesn't exist
      if (!accumulator[keyString]) {
        accumulator[keyString] = [];
      }
  
      // Add the current value to the group
      accumulator[keyString].push(currentValue);
  
      return accumulator;
    }, {} as Record<T[K] extends number | string | symbol ? T[K] : string, T[]>);
  }

  //----------------------------------------------------------------------------------------------------
  onNodeExpandRelation(Results:SparqlResponse, expandedRelation:any)
  {
    var expandedNodeURI = this.currentContextNode.data('id');
    var expandedRelationURI = expandedRelation['relation']['uri'];
    var targetNodeType = expandedRelation['relation']['targetType'];
    var sparqlResults = Results.results.bindings;

    if(sparqlResults.length <=10)
    {
      // we scan all the results
      sparqlResults.forEach(result => {
        // check if the relation node is not already present in the scene
        if(this.cy.getElementById(result['obj']['value']).length==0)
        {
          var nodeLabel = "";
          var splitUri:string[] =[];

          // create a split URI to take the last part of it
          splitUri = result['obj']['value'].split('/');

          // if we don't get information about object type in the results we set it a default value
          if( result['objType'] == undefined)
            result['objType']={'type':'uri','value':'default'};

          // if we don't get any information about the object label we set it as the last part of the URI
          if( result['objLabel'] == undefined)
            {
              nodeLabel = splitUri.pop()!.replace(/\./g, '.\u200b')+"\n("+splitUri.pop()+")";
            }
            else
              nodeLabel = result['objLabel']['value'].replace(/\./g, '.\u200b')

          // finally we add the new node into the scene
          this.cy.add({data:{
                  id:result['obj']['value'],
                  label: nodeLabel,
                  tagged:false,
                  type:'simple'
                }})
            .style( (this.nodeStyels[result['objType']['value'].split('/').pop()!] || this.nodeStyels["Default"]) );
        }

        // add relation
        if( expandedRelation['relation']['direct'])
        {
          var newRelationId = this.currentContextNode.data('id')+result['pred']['value']+ result['obj']['value']+(expandedRelation['relation']['targetType']!==undefined?expandedRelation['relation']['targetType']:"");

          if(this.cy.getElementById(newRelationId).length==0)
          {
            this.cy.add({data:{
                id: newRelationId,
                source: this.currentContextNode.data('id'),
                target: result['obj']['value'] ,
                label:result['pred']['value'].split('/').pop()
                }}).style({'width':'1'});
          }
  
        }
        else
        {
          var newRelationId = result['obj']['value']+(expandedRelation['relation']['targetType']!==undefined?expandedRelation['relation']['targetType']:"")+ result['pred']['value']+ this.currentContextNode.data('id');

          if(this.cy.getElementById(newRelationId).length==0)
          {
            this.cy.add({data:{
                id: newRelationId,
                source:result['obj']['value'],
                target: this.currentContextNode.data('id'),
                label:result['pred']['value'].split('/').pop()
                }}).style({'width':'1'});
          }
        }
      });
    }
    // there are more than 10 results so......
    else // we intantiate the placeholder node to represent multiple nodes
    {
      if(expandedRelation['relation']['direct'])
      {
        var nodeGroupID = "NODEGROUP_"+this.currentContextNode.data('id')+expandedRelation['relation']['uri']+(expandedRelation['relation']['targetType']!==undefined?expandedRelation['relation']['targetType']:"");

        if(this.cy.getElementById(nodeGroupID).length==0)
          {
            // finally we add the new node into the scene
            this.cy.add({data:{
                   id: nodeGroupID,
                   label:  targetNodeType.split('/').pop() +"\n("+sparqlResults.length+")",
                   tagged:false,
                   type:'group',
                   data:sparqlResults
                  }})
              .style( (this.nodeStyels["NodeGroup"]) ).style({'background-image':'assets/'+targetNodeType.split('/').pop()+'-group.png'});
          
          }

          // add relation
          var nodeGroupRelationID = "NODEGROUPREL_"+nodeGroupID;

          if(this.cy.getElementById(nodeGroupRelationID).length==0)
          {
            this.cy.add({data:{id: nodeGroupRelationID,
                source: this.currentContextNode.data('id') ,
                target: nodeGroupID ,
                label: expandedRelation['relation']['uri'].split('/').pop()
                }}).style({'width':'2'});
          }
      }
      else
      {
        var nodeGroupID = "NODEGROUP_"+(expandedRelation['relation']['targetType']!==undefined?expandedRelation['relation']['targetType']:"")+ expandedRelation['relation']['uri'] + this.currentContextNode.data('id');

        if(this.cy.getElementById(nodeGroupID).length==0)
          {
            // finally we add the new node into the scene
            this.cy.add({data:{
                    id: nodeGroupID,
                    label:  targetNodeType.split('/').pop()  +"\n("+sparqlResults.length+")",
                    tagged:false,
                    type:'group',
                    data:sparqlResults
                  }})
              .style( (this.nodeStyels["NodeGroup"]) ).style({'background-image':'assets/'+targetNodeType.split('/').pop()+'-group.png'});
          
          }

          // add relation
          var nodeGroupRelationID = "NODEGROUPREL_"+nodeGroupID;

          if(this.cy.getElementById(nodeGroupRelationID).length==0)
          {
            this.cy.add({data:{id: nodeGroupRelationID,
                source: nodeGroupID,
                target: this.currentContextNode.data('id'),
                label: expandedRelation['relation']['uri'].split('/').pop()
                }}).style({'width':'2'});
          }

      }

    }

    this.cy.center();
    this.cy.zoom(2);
    this.cy.layout(this.elkoptions).run();
  }


  //----------------------------------------------------------------------------------------------------
  onTap(evt)
  {
    if(!evt.target.data('tagged'))
    {
      evt.target.style({'outline-width':'4','outline-offset':'8','outline-color':'#c08'});
      this.taggedNodes.push(evt.target);
    }
    else
    {
      evt.target.style({'outline-width':'0','outline-offset':'4','outline-color':'#0cc'});
      this.taggedNodes.splice(this.taggedNodes.indexOf(evt.target),1);
    }
    evt.target.data('tagged', !evt.target.data('tagged'));

    this.taggedNodes.forEach( elem=>{ console.log(' tagged:'+elem.data('id'))})

    this.multiRelSearch = (this.taggedNodes.length > 1);
  }

  //----------------------------------------------------------------------------------------------------
  onMultiRelExpand()
  {
    var prefix = this.selectValue =="Organisation" || this.selectValue =="TimeInterval" ? "<https://w3id.org/hacid/onto/top-level/":"<https://w3id.org/hacid/onto/ccso/";
    var classURI = prefix +this.selectValue+">";
    var filterInstances = '';

    this.taggedNodes.forEach( elem=>{
      filterInstances += '<'+elem.data('id')+'>';
      if( this.taggedNodes.indexOf(elem)< (this.taggedNodes.length-1) )
        filterInstances += ',';
      });

    var query=`
      SELECT distinct ?sub (count (distinct ?obj) as ?numLinks) (GROUP_CONCAT(DISTINCT ?subLabel; separator=", ") AS ?subLabels) WHERE {
      {
        ?sub a `+ classURI +`  .
        ?sub ?prop ?obj .
        FILTER (?obj in (`+ filterInstances
        +
        ` ))
         OPTIONAL { ?sub rdfs:label ?subLabel }
      }
      UNION
      {
        ?sub a `+ classURI +`  .
        ?obj ?prop ?sub .
        FILTER (?obj in (`+ filterInstances
        +
        ` ))
         OPTIONAL { ?sub rdfs:label ?subLabel }
      }
      } 
      GROUP BY ?sub
      HAVING (count(distinct ?obj) = `+ this.taggedNodes.length +`)
      LIMIT 10 `;


    this.sparqlService.querySparqlEndpoint(this.endpoint, query )
        .subscribe({
          next: (data) => this.expandMultiNodeRelations(data),
          error: (error)=> console.error('There was an error!', error)
    });

  }

  expandMultiNodeRelations(Results:SparqlResponse)
  {
    var sparqlResults = Results.results.bindings;
    

    if(sparqlResults.length > 0)
    {
      sparqlResults.forEach(result => {

        var newNodeURI = result['sub']['value'];
        // Add obj node
        if(this.cy.getElementById(newNodeURI).length==0)
        {
          var nodeLabel = "";
          var splitUri:string[] =[];
          splitUri = newNodeURI.split('/');

          if( result['subLabels'] == undefined)
            {
              nodeLabel = splitUri.pop()!.replace(/\./g, '.\u200b')+"\n("+splitUri.pop()+")";
            }
            else
              nodeLabel = result['subLabels']['value'].replace(/\./g, '.\u200b')


  //         this.cy.add({data:{id:result['obj']['value'], label:splitUri.pop()!.replace(/\./g, '.\u200b')+"\n("+splitUri.pop()+")", tagged:false}})
          this.cy.add({data:{id:newNodeURI, label: nodeLabel, tagged:false}})
            .style( (this.nodeStyels[this.selectValue] || this.nodeStyels["Default"]) );
  //      .style({'shape':'barrel', 'background-color':'#aac','text-wrap':'wrap'});
        }

        var filterInstances = '';
        this.taggedNodes.forEach( elem=>{
          filterInstances += '<'+elem.data('id')+'>';
          if( this.taggedNodes.indexOf(elem)< (this.taggedNodes.length-1) )
            filterInstances += ',';
          });
        var query=`
            SELECT distinct ?prop ?direction ?obj ?objLabel WHERE {
              { 
                  <`+ newNodeURI +`> ?prop ?obj .
                  <`+ newNodeURI +`> rdfs:label ?objLabel .
                  FILTER (?obj in  (`+ filterInstances +` ))
                  BIND( "Direct" as ?direction).
              }
              UNION
              {
                  ?obj ?prop <`+ newNodeURI +`> .
                  <`+ newNodeURI +`> rdfs:label ?objLabel .
                  FILTER (?obj in (`+ filterInstances +` ))
                  BIND( "Inverse" as ?direction).
              }
            } 
            LIMIT 10 `;


        this.sparqlService.querySparqlEndpoint(this.endpoint, query )
          .subscribe({
            next: (data) =>{
              var sparqlResults = data.results.bindings;
              sparqlResults.forEach(result => {   
              
              var relSource = result['direction']['value']=='Direct'? newNodeURI : result['obj']['value'] ;
              var relTarget = result['direction']['value']=='Direct'? result['obj']['value'] : newNodeURI ;

              var newRelationId = relSource + result['prop']['value'] + relTarget;

              if(this.cy.getElementById(newRelationId).length==0)
              {
                this.cy.add({data:{
                      id: newRelationId,
                      source: relSource,
                      target: relTarget,
                      label: result['prop']['value'].split('/').pop()
                }}).style({'width':'1'});
              }
              this.cy.center();
              this.cy.zoom(2);
              this.cy.layout(this.elkoptions).run();   
            });
            },
            error: (error)=> console.error('There was an error!', error)
        });
      });
    }
    else
      this.messageService.add({severity:'warn', summary: 'No Results', detail: 'No results have been found'});


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
