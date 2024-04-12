import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CytoscapeGraphComponent } from './cytoscape-graph/cytoscape-graph.component';
import { RadialMenuComponent } from './radial-menu/radial-menu.component';
//import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CytoscapeGraphComponent, RadialMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent {
  title = 'AngularCytoscapeTest';
}
