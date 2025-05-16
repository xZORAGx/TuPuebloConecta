// src/app/pages/gestion-pueblo/gestion-pueblo.component.ts

import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

// Swiper como Web Component
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-gestion-pueblo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    MatCardModule,
    RouterModule,
    MatButtonModule,
    MatToolbarModule,
    CommonModule
  ],
  templateUrl: './gestion-pueblo.component.html',
  styleUrls: ['./gestion-pueblo.component.css']
})
export class GestionPuebloComponent implements AfterViewInit {
  @ViewChild('swiper', { static: true }) swiperEl!: ElementRef;

  puebloGestionado: string = 'Figueruelas';

  // Items del carrusel
  gestionItems = [
    {
      titulo: 'Noticias',
      accion1: 'Crear noticias',
      accion2: 'Editar noticias',
      accion3: 'Eliminar noticias'
    },
    {
      titulo: 'Deportes',
      accion1: 'Crear eventos deportivos',
      accion2: 'Editar eventos deportivos',
      accion3: 'Eliminar eventos deportivos'
    },
    {
      titulo: 'Instalaciones',
      accion1: 'Añadir instalaciones',
      accion2: 'Editar instalaciones',
      accion3: 'Eliminar instalaciones'
    },
    {
      titulo: 'Fiestas',
      accion1: 'Publicar fiestas',
      accion2: 'Editar fiestas',
      accion3: 'Eliminar fiestas'
    },
    {
      titulo: 'Empleo',
      accion1: 'Publicar ofertas de empleo',
      accion2: 'Editar ofertas de empleo',
      accion3: 'Eliminar ofertas de empleo'
    }
  ];

  constructor(private router: Router) {}

  // Redirige al listado de usuarios del pueblo
  irAListadoUsuarios(): void {
    if (!this.puebloGestionado) {
      console.error('No tienes un pueblo gestionado asignado');
      return;
    }
    this.router.navigate(['/usuarios', this.puebloGestionado]);
  }

  // Ver incidencias por pueblo
  verIncidencias(): void {
    this.router.navigate([`/incidencias/${this.puebloGestionado}`]);
  }

  // Añadir teléfonos (ejemplo)
  anadirTelefonos(): void {
    this.router.navigate(['/telefonos']);
  }

  // Acción al pulsar "Entrar" en cada tarjeta
  entrar(titulo: string): void {
    switch (titulo) {
      case 'Noticias':
        this.router.navigate(['/crear-noticia']);
        break;
      case 'Deportes':
        this.router.navigate(['/deportes']);
        break;
      case 'Instalaciones':
        this.router.navigate(['/instalaciones']);
        break;
      case 'Fiestas':
        this.router.navigate(['/fiestas']);
        break;
      case 'Empleo':
        this.router.navigate(['/empleo']);
        break;
      default:
        console.warn('Sección no reconocida');
    }
  }

  ngAfterViewInit(): void {
    // 1. Configurar Swiper breakpoints
    const swiper: any = this.swiperEl.nativeElement;
    swiper.breakpoints = {
      0:    { slidesPerView: 1, spaceBetween: 10 },
      640:  { slidesPerView: 2, spaceBetween: 15 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    };
    swiper.update && swiper.update();

    // 2. Configurar indicador deslizante de la navbar
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;

      if (!nav || !links.length || !indicator) return;

      // Función para posicionar el indicador
      function updateIndicator(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const parentRect = nav.getBoundingClientRect();
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
      }

      // Inicial: coloca bajo el enlace activo
      const active = nav.querySelector('.nav-link.active') as HTMLElement;
      if (active) {
        updateIndicator(active);
      }

      // Eventos para hover y click
      links.forEach(link => {
        link.addEventListener('mouseenter', () => updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) updateIndicator(curr);
        });
        link.addEventListener('click', () => {
          // Actualiza clase active
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          updateIndicator(link);
        });
      });
    }, 0);
  }
}
