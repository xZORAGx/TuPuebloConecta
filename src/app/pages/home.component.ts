import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

// Swiper Imports
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-home',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('starsCanvas') starsCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private stars: any[] = [];
  private starCount = 100; // Reducido el número de estrellas
  private width!: number;
  private height!: number;

  ngAfterViewInit(): void {
    this.initCanvas();
    this.createStars();
    this.animateStars();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.initCanvas();
  }

  private initCanvas(): void {
    const canvas = this.starsCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Ajustar el canvas al tamaño de la ventana
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;
    
    // Establecer el fondo negro
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private createStars(): void {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.3 // Añadida opacidad variable
      });
    }
  }

  private animateStars(): void {
    const animate = () => {
      // Limpiar canvas con fondo negro
      this.ctx.fillStyle = '#0a0a0a';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Dibujar estrellas con color verde
      this.stars.forEach(star => {
        this.ctx.beginPath();
        this.ctx.fillStyle = `rgba(76, 175, 80, ${star.opacity})`;
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Mover estrella
        star.y += star.speed;
        
        // Si la estrella sale de la pantalla, resetear posición
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
          star.opacity = Math.random() * 0.5 + 0.3; // Nueva opacidad al resetear
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }
}
