import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import {
  Firestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatTableDataSource }        from '@angular/material/table';
import { MatPaginator }              from '@angular/material/paginator';
import { MatSort }                   from '@angular/material/sort';
import { MatDialog }                 from '@angular/material/dialog';
import { CommonModule }              from '@angular/common';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatSelectModule }           from '@angular/material/select';
import { MatOptionModule }           from '@angular/material/core';
import { MatTableModule }            from '@angular/material/table';
import { MatPaginatorModule }        from '@angular/material/paginator';
import { MatSortModule }             from '@angular/material/sort';
import { MatButtonModule }           from '@angular/material/button';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatDialogModule }           from '@angular/material/dialog';
import { MatToolbarModule }          from '@angular/material/toolbar';
import { Router, RouterModule }      from '@angular/router';
import { DialogDescripcionComponent } from '../../shared/dialog-descripcion/dialog-descripcion.component';
import { Subscription }              from 'rxjs';

@Component({
  selector: 'app-listado-incidencias',
  animations: [
    trigger('indicatorSlide', [
      state('void', style({ width: '0', left: '0' })),
      state('*', style({ width: '{{ width }}px', left: '{{ left }}px' }), { params: { width: 0, left: 0 } }),
      transition('void => *', animate('300ms ease-out')),
      transition('* => *', animate('300ms ease-out')),
    ]),
  ],  standalone: true,  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatToolbarModule,
    RouterModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './listado-incidencias.component.html',
  styleUrls: ['./listado-incidencias.component.css']
})
export class ListadoIncidenciasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;
  // User data and menu
  showUserMenu = false;
  userData: any = null;
  private userSub: any;  // Using any type since Firebase's Unsubscribe doesn't match Subscription
  puebloGestionado = 'Figueruelas';

  // Table data
  tiposIncidencias = [
    'Incidencia en el pueblo',
    'Recomendacion de la app',
    'Mascota perdida',
    'Objeto perdido'
  ];

  displayedColumns = [
    'titulo',
    'descripcion',
    'correo',
    'tipo',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  constructor(
    private firestore: Firestore,
    private dialog:    MatDialog,
    private router:    Router,
    public auth:      Auth
  ) {}

  ngOnInit(): void {
    this.obtenerIncidencias();
    
    // Subscribe to user data
    this.userSub = this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userData = {
          correo: user.email,
          pueblo_gestionado: this.puebloGestionado
        };
      } else {
        this.userData = null;
        this.router.navigate(['/']);
      }
    });
  }

  private cleanupFn: (() => void) | null = null;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      const links = nav.querySelectorAll('.nav-link');

      const updateIndicator = (el: HTMLElement, { width = el.offsetWidth, left = el.offsetLeft } = {}) => {
        indicator.style.width = `${width}px`;
        indicator.style.left = `${left}px`;
      };

      const handleMouseEnter = function(this: HTMLElement, e: Event) {
        updateIndicator(this);
      };

      const handleMouseLeave = function(this: HTMLElement, e: Event) {
        const activeLink = nav.querySelector('.nav-link.active') as HTMLElement;
        if (activeLink) {
          updateIndicator(activeLink);
        }
      };

      // Set initial position
      links.forEach(link => {
        const element = link as HTMLElement;
        if (element.classList.contains('active')) {
          updateIndicator(element);
        }

        // Add hover listeners
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        // Click handler
        element.addEventListener('click', function(this: HTMLElement, e: Event) {
          links.forEach(lnk => lnk.classList.remove('active'));
          this.classList.add('active');
          updateIndicator(this);
        });
      });

      // Set initial active state based on current route
      const path = this.router.url;
      links.forEach(link => {
        const element = link as HTMLElement;
        const href = element.getAttribute('routerLink');
        if (href && path.includes(href)) {
          element.classList.add('active');
          updateIndicator(element);
        }
      });

      // Update on window resize
      const resizeObserver = new ResizeObserver(() => {
        const activeLink = nav.querySelector('.nav-link.active') as HTMLElement;
        if (activeLink) updateIndicator(activeLink);
      });
      resizeObserver.observe(nav);

      // Store cleanup function
      this.cleanupFn = () => {
        resizeObserver.disconnect();
        links.forEach(link => {
          const element = link as HTMLElement;
          element.removeEventListener('mouseenter', handleMouseEnter);
          element.removeEventListener('mouseleave', handleMouseLeave);
        });
      };
    });
  }

  ngOnDestroy(): void {
    if (this.cleanupFn) {
      this.cleanupFn();
    }
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  obtenerIncidencias() {
    // Implementación para obtener las incidencias
  }

  // Métodos para el menú de usuario
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.auth.signOut().then(() => this.router.navigate(['/']));
  }

  // Métodos para filtros
  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  aplicarFiltroTipo(event: any): void {
    this.dataSource.filter = event.value.trim().toLowerCase();
  }

  // Método para mostrar descripción completa
  verDescripcionCompleta(descripcion: string): void {
    this.dialog.open(DialogDescripcionComponent, {
      data: { descripcion },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

  // Normalizar URL de imagen
  normalizeUrl(url: string): string {
    return url ? url.replace(/\/o\/incidencias%2[fF]/i, '/o/Incidencias%2F') : '';
  }

  // Eliminar incidencia
  eliminarIncidencia(incidencia: any): void {
    if (confirm(`¿Seguro que quieres eliminar la incidencia "${incidencia.Titulo}"?`)) {
      const incidenciaDoc = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Incidencias`,
        incidencia.id
      );
      deleteDoc(incidenciaDoc).then(() => this.obtenerIncidencias());
    }
  }
}
