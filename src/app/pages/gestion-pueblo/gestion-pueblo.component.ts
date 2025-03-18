import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
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

  ngAfterViewInit(): void {
    const swiper: any = this.swiperEl.nativeElement;

    swiper.breakpoints = {
      0: { slidesPerView: 1, spaceBetween: 10 },
      640: { slidesPerView: 2, spaceBetween: 15 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    };

    swiper.update && swiper.update(); // Refresca el componente si es necesario
  }

  entrar(titulo: string): void {
    console.log(`Entrando en ${titulo}`);
  }
}
