import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { trigger, state, style, transition, animate, animateChild, query, group } from '@angular/animations';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-radial-menu',
  standalone: true,
  imports: [CommonModule,NgFor, ButtonModule],
  templateUrl: './radial-menu.component.html',
  styleUrl: './radial-menu.component.css',
  animations:[
    trigger('menuAnimation', [
      state('closed', style({
        transform: 'scale(0.4)',
        opacity:0
      })),
      state('open', style({
        transform: 'scale(1)',
        opacity:1
      })),
      transition('closed => open', animate('100ms ease-in')),
      transition('open => closed', animate('100ms ease-out'))
    ]),
    trigger('elementAnimation', [
      state(':enter', style({
        rotation:'30deg'
      })),
      state('open', style({
        rotation:'0deg'
      })),
      transition('closed => open', animate('200ms ease-in')),
      transition('open => closed', animate('200ms ease-out'))
    ])   
   
  ]
})


export class RadialMenuComponent implements OnInit{
  menuState: string = 'closed';
  items = [
    { name:'', icon:'pi pi-times'},
    { name:'', icon:'pi pi-bars'},
    { name:'', icon:'pi pi-bars'},
    { name:'', icon:'pi pi-bars'},
    { name:'', icon:'pi pi-bars'},
    { name:'', icon:'pi pi-bars'}
  ];


  constructor() { }

  calculateRadialPosition(index: number) {
    const radius = 50; // Adjust this according to your needs
    const centerX = -20; // Adjust this according to your needs
    const centerY = -20; // Adjust this according to your needs
    const totalItems = this.items.length;
    const angle = (2 * Math.PI) / totalItems; // Angle between items

    // Calculate position using trigonometry
    const angleForItem = index * angle;
    const x = centerX + radius * Math.cos(angleForItem);
    const y = centerY + radius * Math.sin(angleForItem);

    return {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`
    };
  }

  ngOnInit(): void {
  }

  pointerover()
  {
    this.menuState = 'open';
  }

  pointerleave()
  {
    //this.menuState = 'closed';
  }

  toggleMenu() {
    this.menuState = (this.menuState === 'closed' ? 'open' : 'closed');
  }
}
