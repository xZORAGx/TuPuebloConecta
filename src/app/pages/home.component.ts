import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

// Swiper Imports
import { register } from 'swiper/element/bundle';
register();
// Activar los módulos de Swiper

@Component({
  selector: 'app-home',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    RouterModule,
    MatButtonModule,
    MatToolbarModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {

  // REFERENCIA AL CANVAS
  @ViewChild('starsCanvas') starsCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private stars: any[] = [];
  private starCount = 150;
  private width!: number;
  private height!: number;

  // CUANDO YA SE HA CARGADO LA VISTA
  ngAfterViewInit(): void {
    this.initCanvas();
    this.createStars();
    this.animateStars();
  }

  // CUANDO SE CAMBIA EL TAMAÑO DE VENTANA
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.initCanvas();
    this.createStars();
  }

  // INICIALIZAR EL CANVAS
  private initCanvas() {
    const canvas = this.starsCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  // CREAR LAS ESTRELLAS
  private createStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.3 + 0.05
      });
    }
  }

  // ANIMAR LAS ESTRELLAS EN BUCLE
  private animateStars() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let star of this.stars) {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#4caf50'; // Color verde principal
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#76ff03'; // Verde neón
      this.ctx.fill();

      // Mueve las estrellas hacia abajo
      star.y += star.speed;

      // Si pasa el fondo, vuelve arriba
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }

    requestAnimationFrame(() => this.animateStars());
  }
}
