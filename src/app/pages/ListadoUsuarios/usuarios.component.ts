import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Firestore, collection, getDocs, deleteDoc, doc, updateDoc, docData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

import { EditarUsuarioDialog } from './editar-usuario-dialog.component';

// User Web Interface
interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  // ─── State ───
  puebloGestionado: string = '';
  displayedColumns: string[] = ['usuario', 'correo', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  // ─── User Menu State ───
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  // ─── ViewChild References ───
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    public auth: Auth,
    public router: Router
  ) {}

  ngOnInit(): void {
    // 1) Cargar datos del usuario
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(userDoc).subscribe(data => {
        this.userData = data as UserWeb;
        this.puebloGestionado = this.userData.pueblo_gestionado;
        this.obtenerUsuarios();
      });
    }
  }

  ngAfterViewInit(): void {
    // Indicador deslizante de la navbar
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;

      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect(), p = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left = `${r.left - p.left}px`;
      };

      // Actualizar indicador inicial en el enlace activo
      const active = nav.querySelector('.nav-link.active') as HTMLElement;
      if (active) updateIndicator(active);

      // Añadir listeners para efectos hover y click
      links.forEach(link => {
        link.addEventListener('mouseenter', () => updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) updateIndicator(curr);
        });
      });
    }, 0);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // ─── User Menu Methods ───
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.auth.signOut().then(() => this.router.navigate(['/']));
  }

  // ─── Data Methods ───
  async obtenerUsuarios(): Promise<void> {
    const usuariosRef = collection(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`);
    const querySnapshot = await getDocs(usuariosRef);
    const usuarios = querySnapshot.docs.map(doc => ({
      id: doc.id,
      usuario: doc.data()['Usuario'],
      correo: doc.data()['Correo'],
      tipo: doc.data()['Tipo']
    }));
    this.dataSource.data = usuarios;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  editarUsuario(usuario: any): void {
    const dialogRef = this.dialog.open(EditarUsuarioDialog, {
      width: '400px',
      data: {
        Usuario: usuario.usuario,
        Correo: usuario.correo,
        Tipo: usuario.tipo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const userDoc = doc(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`, usuario.id);
        updateDoc(userDoc, {
          Usuario: result.Usuario,
          Correo: result.Correo,
          Tipo: result.Tipo
        }).then(() => {
          this.obtenerUsuarios();
        });
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (confirm(`¿Seguro que quieres eliminar al usuario "${usuario.usuario}"?`)) {
      const userDoc = doc(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`, usuario.id);
      deleteDoc(userDoc).then(() => {
        this.obtenerUsuarios();
      });
    }
  }

  // ─── Navigation Methods ───
  irAListadoUsuarios(): void {
    const p = this.userData?.pueblo_gestionado;
    if (p) this.router.navigate(['/usuarios', p]);
  }
  
  verIncidencias(): void {
    const p = this.userData?.pueblo_gestionado;
    if (p) this.router.navigate([`/incidencias/${p}`]);
  }
  
  anadirTelefonos(): void {
    this.router.navigate(['/telefonos']);
  }
}
