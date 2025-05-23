import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DemoRequestDialogComponent } from '../shared/components/demo-request-dialog.component';
import { DemoConfirmationDialogComponent } from '../shared/components/demo-confirmation-dialog.component';
import { DemoService } from '../shared/services/demo.service';

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
    CommonModule  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', './touch-optimizations.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('starsCanvas') starsCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private stars: any[] = [];
  private starCount = 100; // Reducido el número de estrellas
  private width!: number;
  private height!: number;
  private animationFrameId: number | null = null;

  // Nuevos datos para secciones dinámicas
  faqItems: any[] = [];
  
  constructor(
    private dialog: MatDialog,
    private demoService: DemoService
  ) {}
  // Abrir el formulario de solicitud de demostración
  openDemoRequestDialog(): void {
    const dialogRef = this.dialog.open(DemoRequestDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: ['demo-dialog-container', 'mat-typography'],
      autoFocus: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processDemoRequest(result);
      }
    });
  }

  // Procesar la solicitud de demostración
  private processDemoRequest(demoData: any): void {
    this.demoService.enviarSolicitudDemo(demoData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showConfirmationDialog(response.message, demoData);
        }
      },
      error: (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí se podría mostrar un mensaje de error
      }
    });
  }

  // Mostrar diálogo de confirmación
  private showConfirmationDialog(message: string, demoData: any): void {
    this.dialog.open(DemoConfirmationDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: {
        message,
        demoData
      }
    });
  }

  ngOnInit(): void {
    // Inicializar FAQs con estado cerrado
    this.faqItems = [
      { 
        question: '¿Cómo puede mi ayuntamiento unirse a Tu Pueblo Conecta?', 
        answer: 'El proceso es sencillo. Póngase en contacto con nuestro equipo a través del formulario en la sección de contacto o llamando al número proporcionado. Un asesor le guiará por todo el proceso de implementación, que suele durar menos de dos semanas.',
        isOpen: false 
      },
      { 
        question: '¿Es necesario tener conocimientos técnicos para usar la plataforma?', 
        answer: 'No, nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Además, ofrecemos formación gratuita para todo el personal del ayuntamiento y soporte técnico continuo.',
        isOpen: false 
      },
      { 
        question: '¿Cómo pueden los ciudadanos acceder a la información de su municipio?', 
        answer: 'Los ciudadanos pueden acceder a través de nuestra aplicación móvil, disponible para iOS y Android, o mediante la versión web. Solo necesitan registrarse con su correo electrónico y seleccionar su municipio.',
        isOpen: false 
      },
      { 
        question: '¿Qué coste tiene para el ayuntamiento?', 
        answer: 'Ofrecemos diferentes planes según el tamaño del municipio y las funcionalidades necesarias. Contáctenos para recibir un presupuesto personalizado. Todos nuestros planes incluyen soporte técnico y actualizaciones.',
        isOpen: false 
      }
    ];
  }  ngAfterViewInit(): void {
    this.initCanvas();
    this.createStars();
    this.animateStars();
    
    // Add event listener to detect when we're at the bottom of the page
    window.addEventListener('scroll', this.handleScroll);
    
    // Initialize Swiper with responsive settings
    this.initSwiperResponsive();
  }
  
  private initSwiperResponsive(): void {
    // This will ensure the Swiper container adapts to viewport changes
    window.addEventListener('resize', () => {
      const swiperElement = document.querySelector('swiper-container');
      if (swiperElement) {
        // @ts-ignore - Force Swiper to update after resize
        swiperElement.swiper?.update();
      }
    });
  }
    ngOnDestroy(): void {
    // Cleanup animation frame and event listeners
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', () => {
      const swiperElement = document.querySelector('swiper-container');
      if (swiperElement) {
        // @ts-ignore
        swiperElement.swiper?.update();
      }
    });
  }
  
  // Toggle FAQ items
  toggleFaq(index: number): void {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
  }
  
  // Handle scroll events to check for footer visibility
  private handleScroll = (): void => {
    const footerElement = document.querySelector('.footer');
    if (footerElement) {
      const rect = footerElement.getBoundingClientRect();
      
      // If footer is becoming visible, slow down the stars animation
      if (rect.top < window.innerHeight) {
        // Slow down stars when footer is visible
        this.stars.forEach(star => {
          star.speed = Math.max(0.05, star.speed * 0.8);
        });
      } else {
        // Normal speed when footer is not visible
        this.stars.forEach(star => {
          star.speed = Math.random() * 0.3 + 0.1;
        });
      }
    }
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

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}
