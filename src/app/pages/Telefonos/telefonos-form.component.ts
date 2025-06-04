// telefonos-form.component.ts

import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-telefonos-form',
  standalone: true,
  animations: [
    trigger('indicatorSlide', [
      state('void', style({ width: '0', left: '0' })),
      state('*', style({ width: '{{ width }}px', left: '{{ left }}px' }), { params: { width: 0, left: 0 } }),
      transition('void => *', animate('300ms ease-out')),
      transition('* => *', animate('300ms ease-out')),
    ]),
  ],
  templateUrl: './telefonos-form.component.html',
  styleUrls: ['./telefonos-form.component.css'],  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class TelefonosFormComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('navToolbar', { static: true }) navEl!: ElementRef<HTMLElement>;

  // User data and menu
  showUserMenu = false;
  userData: any = null;
  private userSub: any;  // Using any type since Firebase's Unsubscribe doesn't match Subscription  // App data
  puebloGestionado = 'Figueruelas';
  telefonos$!: Observable<any[]>;
  form: FormGroup;
  editandoId: string | null = null;
  mensajeExito: string | null = null;
  cargando = false;

  // Navbar indicator tracking
  private lastActive: HTMLElement | null = null;

  // Services
  private firestore: Firestore = inject(Firestore);
  private fb: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);
  private auth: Auth = inject(Auth);
  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });
  }

  ngOnInit(): void {
    // Get telefonos data
    const ref = collection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Telefonos`
    );
    this.telefonos$ = collectionData(ref, { idField: 'id' });

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
  ngAfterViewInit(): void {
    // Solo inicializa eventos de hover/click
    setTimeout(() => {
      const nav = this.navEl.nativeElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;

      // Eventos hover
      links.forEach(link => {
        link.addEventListener('mouseenter', () => this.updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) this.updateIndicator(curr);
        });
      });
    }, 0);
  }

  ngAfterViewChecked(): void {
    // Siempre reposiciona el indicador tras cada cambio de vista
    const nav = this.navEl?.nativeElement;
    if (!nav) return;
    const active = nav.querySelector('.nav-link.active') as HTMLElement;
    if (active && active !== this.lastActive) {
      this.updateIndicator(active);
      this.lastActive = active;
    }
  }

  private updateIndicator(el: HTMLElement) {
    const nav = this.navEl.nativeElement;
    const indicator = nav.querySelector('.indicator') as HTMLElement;
    if (!el || !indicator) return;
    const r  = el.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    indicator.style.width = `${r.width}px`;
    indicator.style.left  = `${r.left - nr.left}px`;
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub();
  }
  async guardarTelefono() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;

    const datos = this.form.value;
    try {
      if (this.editandoId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`
        );
        await updateDoc(docRef, datos);
        this.mensajeExito = 'Teléfono actualizado correctamente';
        this.editandoId = null;
      } else {
        const ref = collection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos`
        );
        await addDoc(ref, datos);
        this.mensajeExito = 'Teléfono añadido correctamente';
      }
      this.form.reset();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
      
    } catch (err) {
      console.error('Error guardando teléfono:', err);
      alert('Hubo un error al guardar. Inténtalo de nuevo.');
    } finally {
      this.cargando = false;
    }
  }

  editarTelefono(tel: any) {
    this.editandoId = tel.id;
    this.form.setValue({
      nombre: tel.nombre,
      numero: tel.numero
    });
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.form.reset();
  }

  async eliminarTelefono(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este teléfono?')) return;
    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Telefonos/${id}`
      );
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error eliminando teléfono:', err);
      alert('No se pudo eliminar. Revisa la consola.');
    }
  }

  // User menu methods
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.auth.signOut().then(() => this.router.navigate(['/']));
  }
  // Navigation methods
  navegarA(seccion: string): void {
    switch (seccion) {
      case 'Noticias':
        this.router.navigate(['/crear-noticia']);
        break;
      case 'Deportes':
        this.router.navigate(['/deportes']);
        break;
      case 'Fiestas':
        this.router.navigate(['/fiestas']);
        break;
      case 'Instalaciones':
        this.router.navigate(['/instalaciones']);
        break;
      case 'Empleo':
        this.router.navigate(['/empleo']);
        break;
      case 'Telefonos':
        this.router.navigate(['/telefonos']);
        break;
    }
  }

  get rutaActual(): string {
    return this.router.url;
  }

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
