import { Component, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { LX } from 'lexgui';

@Component({
  selector: 'app-lexgui-test',
  standalone: true,
  imports: [],
  templateUrl: './lexgui-test.component.html',
  styleUrl: './lexgui-test.component.css',
  encapsulation: ViewEncapsulation.None,
})

export class LexguiTestComponent {
  @ViewChild("lx") lxElem: ElementRef;

  area;

  
  ngAfterViewInit()
  {
    this.area=LX.init("lx","mainarea",false);
    this.area.addPanel();
    this.area.addMenubar( m => {
     m.add( "Scene/Open Scene" );
     m.add( "Scene/New Scene", () => { console.log("New scene created!") } );
     m.add( "Scene/" ); // This is a separator!
     m.add( "Scene/Open Recent/hello.scene");
     m.add( "Scene/Open Recent/goodbye.scene" );
     m.add( "Project/Export/DAE", { short: "E" } );
     m.add( "Project/Export/GLTF" );
     m.add( "View/Show grid", { type: "checkbox", checked: true, 
     callback: (v) => { 
         console.log("Show grid:", v);
     }});
     m.add( "Help/About" );
     m.add( "Help/Support", { callback: () => { 
         console.log("Support!") }, icon: "fa-solid fa-heart" } );
     });
  }


}
