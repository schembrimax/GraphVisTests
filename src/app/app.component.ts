import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CytoscapeGraphComponent } from './cytoscape-graph/cytoscape-graph.component';
import { RadialMenuComponent } from './radial-menu/radial-menu.component';
//import { HttpClientModule } from '@angular/common/http';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { CSVisualisationComponent } from './cs-visualisation/cs-visualisation.component';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI8p4Wb3WV9X8nYMkbrmyJLF0q9l7J5Mk",
  authDomain: "hacid-multiuser-test.firebaseapp.com",
  projectId: "hacid-multiuser-test",
  storageBucket: "hacid-multiuser-test.appspot.com",
  messagingSenderId: "266423542308",
  appId: "1:266423542308:web:37c820fd3974b0cd85eeb1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CytoscapeGraphComponent, RadialMenuComponent, CSVisualisationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent {
  title = 'AngularCytoscapeTest';
}
