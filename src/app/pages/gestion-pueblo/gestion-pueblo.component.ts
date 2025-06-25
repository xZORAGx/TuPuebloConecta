import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  AfterViewInit,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';

import { register } from 'swiper/element/bundle';
register();

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

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
export class GestionPuebloComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('swiper', { static: true }) swiperEl!: ElementRef;

  showUserMenu = false;
  userData: UserWeb | null = null;
  private sub?: Subscription;

  gestionItems = [
    { titulo: 'Noticias',     accion1: 'Crear noticias',           accion2: 'Editar noticias',           accion3: 'Eliminar noticias' },
    { titulo: 'Deportes',     accion1: 'Crear eventos deportivos', accion2: 'Editar eventos deportivos', accion3: 'Eliminar eventos deportivos' },
    { titulo: 'Servicios', accion1: 'Añadir servicios',      accion2: 'Editar servicios',      accion3: 'Eliminar servicios' },
    { titulo: 'Fiestas',      accion1: 'Publicar fiestas',           accion2: 'Editar fiestas',            accion3: 'Eliminar fiestas' },
    { titulo: 'Empleo',       accion1: 'Publicar ofertas de empleo', accion2: 'Editar ofertas de empleo',  accion3: 'Eliminar ofertas de empleo' }
  ];

  constructor(
    public router: Router,
    public auth: Auth,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    const userDoc = doc(this.firestore, 'usuarios_web', uid);
    this.sub = docData(userDoc).subscribe(data => {
      this.userData = data as UserWeb;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  irAListadoUsuarios(): void {
    const pueblo = this.userData?.pueblo_gestionado;
    if (!pueblo) return;
    this.router.navigate(['/usuarios', pueblo]);
  }  verIncidencias(): void {
    const pueblo = this.userData?.pueblo_gestionado;
    if (!pueblo) return;
    this.router.navigate([`/incidencias/${pueblo}`]);
  }

  anadirTelefonos(): void {
    this.router.navigate(['/telefonos']);
  }

  entrar(titulo: string): void {
    switch (titulo) {
      case 'Noticias':      this.router.navigate(['/crear-noticia']);  break;
      case 'Deportes':      this.router.navigate(['/deportes']);       break;
      case 'Servicios': this.router.navigate(['/servicios']);  break;
      case 'Fiestas':       this.router.navigate(['/fiestas']);       break;
      case 'Empleo':        this.router.navigate(['/empleo']);        break;
    }
  }
  ngAfterViewInit(): void {
    // Configura Swiper
    const swiper: any = this.swiperEl.nativeElement;
    swiper.breakpoints = {
      0: { slidesPerView: 1, spaceBetween: 10 },
      480: { slidesPerView: 1, spaceBetween: 15 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    };
    swiper.update && swiper.update();

    // Indicador de navbar
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;
      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect(), nr = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left  = `${r.left - nr.left}px`;
      };
      const active = nav.querySelector('.nav-link.active') as HTMLElement;
      if (active) updateIndicator(active);
      links.forEach(link => {
        link.addEventListener('mouseenter', () => updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) updateIndicator(curr);
        });
        link.addEventListener('click', () => {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          updateIndicator(link);
        });
      });
    }, 0);
  }
}
