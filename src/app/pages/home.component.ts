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

  @ViewChild('starsCanvas') starsCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private stars: any[] = [];
  private starCount = 150;
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
    this.createStars();
  }

  private initCanvas() {
    const canvas = this.starsCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private createStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      const depth = Math.random();
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: depth * 1.5,
        speed: depth * 0.3 + 0.05,
        opacity: Math.random() * 0.5 + 0.5
      });
    }
  }

  private animateStars() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let star of this.stars) {
      // Twinkle effect
      star.opacity += (Math.random() - 0.5) * 0.05;
      if (star.opacity > 1) star.opacity = 1;
      if (star.opacity < 0.3) star.opacity = 0.3;

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(76, 175, 80, ${star.opacity})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(118, 255, 3, 0.5)';
      this.ctx.fill();

      star.y += star.speed;

      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }

    requestAnimationFrame(() => this.animateStars());
  }
}
