import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import ThreeForceGraph from 'three-forcegraph';
import ThreeRenderObjects from 'three-render-objects';

@Component({
  selector: 'app-tree-js-test',
  standalone: true,
  imports: [],
  templateUrl: './tree-js-test.component.html',
  styleUrl: './tree-js-test.component.css'
})
export class TreeJsTestComponent implements AfterViewInit {
  @ViewChild('rendererCanvas') rendererCanvas: ElementRef;
  
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cube;
  private clock;

  private myGraph;

  /* We put initializatoin code here because of timing.
     the ViewChild component isn't available in ngOnInit
     but only in onAfterViewInit, and we use ViewChild
     to get the canvas for threejs
   */
  ngAfterViewInit() {
    this.initThree();
    this.animate();
  }

  private initThree() {
    const canvas = this.rendererCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 15;


    // Adding graph data
    const N = 30;
    const gData = {
      nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: id,
          target: Math.round(Math.random() * (id-1))
        }))
    };

    this.myGraph = new ThreeForceGraph().graphData(gData);


    const geometry = new THREE.BoxGeometry(1,1,1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
    this.scene.add(this.myGraph);

    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.myGraph.position);
    this.camera.position.z = Math.cbrt(N) * 180;
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.cube.rotation.x += 0.5 * delta;
    
    this.cube.rotation.y += 0.5 * delta;
    this.myGraph.tickFrame();

    this.renderer.render(this.scene, this.camera);
  }
}