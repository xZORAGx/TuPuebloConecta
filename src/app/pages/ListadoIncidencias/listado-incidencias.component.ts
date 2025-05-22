import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

// Firebase
import { Firestore, collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

// Components
import { DialogDescripcionComponent } from '../../shared/dialog-descripcion/dialog-descripcion.component';

interface Incidencia {
  id: string;
  Titulo: string;
  Descripcion: string;
  Correo: string;
  tipo: string;
  fotoUrl?: string | null;
}

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
  styleUrls: ['./listado-incidencias.component.css'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const paginatorIntl = new MatPaginatorIntl();
        paginatorIntl.itemsPerPageLabel = 'Elementos por página:';
        paginatorIntl.nextPageLabel = 'Siguiente';
        paginatorIntl.previousPageLabel = 'Anterior';
        paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
          if (length === 0) return `0 de ${length}`;
          const start = page * pageSize + 1;
          const end = Math.min(start + pageSize - 1, length);
          return `${start} - ${end} de ${length}`;
        };
        return paginatorIntl;
      }
    }
  ]
})
export class ListadoIncidenciasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // User data and menu
  showUserMenu = false;
  userData: any = null;
  private authStateSubscription?: Subscription;
  puebloGestionado = 'Figueruelas';

  // Table data
  tiposIncidencias = [
    'Incidencia en el pueblo',
    'Recomendacion de la app',
    'Mascota perdida',
    'Objeto perdido'
  ];

  displayedColumns = ['titulo', 'descripcion', 'correo', 'tipo', 'acciones'];
  dataSource: MatTableDataSource<Incidencia>;
  private filterValue = '';
  private tipoFilterValue = '';

  // Cleanup and navigation
  private isComponentActive = true;
  private cleanupFn?: () => void;

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router,
    public auth: Auth
  ) {
    this.dataSource = new MatTableDataSource<Incidencia>();
    
    // Initialize filter predicate
    this.dataSource.filterPredicate = (data: Incidencia, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.Titulo.toLowerCase().includes(searchStr) ||
             data.Descripcion.toLowerCase().includes(searchStr) ||
             data.Correo.toLowerCase().includes(searchStr) ||
             data.tipo.toLowerCase().includes(searchStr);
    };
  }

  ngOnInit(): void {
    this.obtenerIncidencias();
    
    this.authStateSubscription = new Subscription();
    this.authStateSubscription.add(
      this.auth.onAuthStateChanged(user => {
        if (this.isComponentActive) {
          if (user) {
            this.userData = {
              correo: user.email,
              pueblo_gestionado: this.puebloGestionado
            };
          } else {
            this.userData = null;
            this.router.navigate(['/']);
          }
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // Configure paginator and sort after data is loaded
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    // Configure sliding indicator for navbar
    this.initializeNavbarIndicator();
  }

  private initializeNavbarIndicator(): void {
    setTimeout(() => {
      const nav = this.navToolbar?.nativeElement;
      const links = Array.from(nav?.querySelectorAll('.nav-link') || []) as HTMLElement[];
      const indicator = nav?.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;

      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const p = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left = `${r.left - p.left}px`;
      };

      const active = nav.querySelector('.nav-link.active') as HTMLElement;
      if (active) updateIndicator(active);

      const cleanup: (() => void)[] = [];
      links.forEach(link => {
        const mouseenter = () => updateIndicator(link);
        const mouseleave = () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) updateIndicator(curr);
        };
        const click = () => {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          updateIndicator(link);
        };

        link.addEventListener('mouseenter', mouseenter);
        link.addEventListener('mouseleave', mouseleave);
        link.addEventListener('click', click);

        cleanup.push(() => {
          link.removeEventListener('mouseenter', mouseenter);
          link.removeEventListener('mouseleave', mouseleave);
          link.removeEventListener('click', click);
        });
      });

      this.cleanupFn = () => cleanup.forEach(fn => fn());
    });
  }

  ngOnDestroy(): void {
    this.isComponentActive = false;
    if (this.cleanupFn) {
      this.cleanupFn();
    }
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }

  // User menu functions
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.auth.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  // Filter functions
  aplicarFiltro(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  aplicarFiltroTipo(event: { value: string }): void {
    this.tipoFilterValue = event.value;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filter = this.filterValue;
    
    if (this.tipoFilterValue) {
      if (filter) {
        filter = `${filter} ${this.tipoFilterValue}`;
      } else {
        filter = this.tipoFilterValue;
      }
    }
    
    this.dataSource.filter = filter.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async obtenerIncidencias() {
    try {
      const incidenciasRef = collection(this.firestore, `pueblos/${this.puebloGestionado}/Incidencias`);
      const querySnapshot = await getDocs(incidenciasRef);
      
      const incidencias = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          Titulo: data['Titulo'] || '',
          Descripcion: data['Descripcion'] || '',
          Correo: data['Correo'] || '',
          tipo: data['tipo'] || '',
          fotoUrl: data['fotoUrl'] ? this.getStorageUrl(data['fotoUrl']) : null
        } as Incidencia;
      });

      this.dataSource.data = incidencias;
      
      // Ensure paginator and sort are set after data is loaded
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    } catch (error) {
      console.error('Error al obtener incidencias:', error);
    }
  }

  getStorageUrl(fileName: string): string {
    if (!fileName) return '';
    
    // If it's already a full URL, return as is
    if (fileName.startsWith('https://firebasestorage.googleapis.com')) {
      return fileName;
    }
    
    // Remove any path prefix if present (e.g., incidencias/)
    const cleanFileName = fileName.split('/').pop() || fileName;
    
    // Construct the Firebase Storage URL with the correct bucket and path
    return `https://firebasestorage.googleapis.com/v0/b/trabajo-fin-grado-7af82.appspot.com/o/incidencias%2F${encodeURIComponent(cleanFileName)}?alt=media`;
  }

  verDescripcionCompleta(descripcion: string): void {
    this.dialog.open(DialogDescripcionComponent, {
      data: { descripcion },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

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
