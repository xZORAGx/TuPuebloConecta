// telefonos-form.component.ts

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  docData
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import { query, orderBy } from '@angular/fire/firestore';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

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
  styleUrls: ['./telefonos-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class TelefonosFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  // User data and menu
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub: Subscription | undefined;

  // App data
  puebloGestionado = 'Figueruelas';
  telefonos$!: Observable<any[]>;
  form: FormGroup;
  editandoId: string | null = null;
  cargando = false;
  mensajeExito: string | null = null;
  rutaActual: string = '';

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private location: Location,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });
  }  ngOnInit(): void {
    // Establecer la ruta actual para la navegación
    this.rutaActual = this.router.url;

    // Obtener datos del usuario autenticado
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(userDoc).subscribe(data => {
        this.userData = data as UserWeb;
        if (this.userData?.pueblo_gestionado) {
          this.puebloGestionado = this.userData.pueblo_gestionado;
          this.loadTelefonos();
        } else {
          console.warn('Usuario autenticado sin pueblo asignado');
        }
      });
    } else {
      // Si no hay usuario autenticado, podríamos redirigir a login
      // Por ahora, usar valor por defecto
      console.warn('No hay usuario autenticado, usando pueblo por defecto');
      this.loadTelefonos();
    }
  }

  loadTelefonos(): void {
    try {
      // Usar la colección de teléfonos para el pueblo gestionado
      const telefonosRef = collection(this.firestore, `pueblos/${this.puebloGestionado}/Telefonos`);
      // Ordenar por nombre para mostrar alfabéticamente
      const q = query(telefonosRef, orderBy('nombre', 'asc'));
      // Suscribirse a los cambios en tiempo real con collectionData
      this.telefonos$ = collectionData(q, { idField: 'id' });
    } catch (error) {
      console.error('Error cargando teléfonos:', error);
    }
  }
  ngAfterViewInit(): void {
    // Configurar el indicador de navegación
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      if (!nav) return;
      
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!links.length || !indicator) return;
      
      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const nr = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left = `${r.left - nr.left}px`;
      };
      
      // Forzar la activación del enlace correspondiente a la ruta actual
      const currentRoute = this.router.url;
      let activeLink: HTMLElement | null = null;
      
      if (currentRoute === '/crear-noticia') {
        activeLink = links.find(link => link.textContent?.includes('Noticias')) || null;
      } else if (currentRoute === '/deportes') {
        activeLink = links.find(link => link.textContent?.includes('Deportes')) || null;
      } else if (currentRoute === '/fiestas') {
        activeLink = links.find(link => link.textContent?.includes('Fiestas')) || null;
      } else if (currentRoute === '/instalaciones') {
        activeLink = links.find(link => link.textContent?.includes('Instalaciones')) || null;
      } else if (currentRoute === '/empleo') {
        activeLink = links.find(link => link.textContent?.includes('Empleo')) || null;
      } else if (currentRoute === '/telefonos') {
        activeLink = links.find(link => link.textContent?.includes('Teléfonos')) || null;
      }
      
      if (activeLink) {
        links.forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');
        updateIndicator(activeLink);
      }
      
      links.forEach(link => {
        link.addEventListener('mouseenter', () => updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) updateIndicator(curr);
        });
      });

      // Actualizar al cambiar el tamaño de la ventana
      window.addEventListener('resize', () => {
        const activeNavLink = nav.querySelector('.nav-link.active') as HTMLElement;
        if (activeNavLink) updateIndicator(activeNavLink);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }
  async guardarTelefono() {
    // Validamos el formulario y marcamos campos como tocados para mostrar errores
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;
    
    const datos = {
      nombre: this.form.value.nombre?.trim(),
      numero: this.form.value.numero?.trim()
    };

    try {
      if (this.editandoId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`
        );
        await updateDoc(docRef, datos);
        this.mensajeExito = 'Teléfono actualizado correctamente.';
        this.editandoId = null;
      } else {
        const ref = collection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos`
        );
        await addDoc(ref, datos);
        this.mensajeExito = 'Teléfono añadido correctamente.';
      }
      
      this.form.reset();
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
      
    } catch (err) {
      console.error('Error guardando teléfono:', err);
      alert('❌ Error al guardar el teléfono');
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
    
    // Hacer scroll al formulario en dispositivos móviles
    if (window.innerWidth < 992) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.form.reset();
  }

  async eliminarTelefono(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este teléfono?')) return;
    
    this.cargando = true;
    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Telefonos/${id}`
      );
      await deleteDoc(docRef);
      
      this.mensajeExito = 'Teléfono eliminado correctamente.';
      
      // Si estamos editando el teléfono que se elimina, cancelamos la edición
      if (this.editandoId === id) {
        this.cancelarEdicion();
      }
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
      
    } catch (err) {
      console.error('Error eliminando teléfono:', err);
      alert('❌ Error al eliminar el teléfono');
    } finally {
      this.cargando = false;
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

  volver(): void {
    this.location.back();
  }

  irAEditarTelefono(telefonoId: string): void {
    this.router.navigate(['editar', telefonoId], { relativeTo: this.route });
  }
  navegarA(seccion: string): void {
    let ruta = '';
    switch (seccion) {
      case 'Noticias': 
        ruta = '/crear-noticia';
        break;
      case 'Deportes': 
        ruta = '/deportes';
        break;
      case 'Fiestas': 
        ruta = '/fiestas';
        break;
      case 'Instalaciones': 
        ruta = '/instalaciones';
        break;
      case 'Empleo': 
        ruta = '/empleo';
        break;
      case 'Telefonos': 
        ruta = '/telefonos';
        break;
    }
    
    if (ruta) {
      this.rutaActual = ruta;
      this.router.navigate([ruta]);
    }
  }

  irAGestion(): void {
    this.router.navigate(['/gestion']);
  }
}
