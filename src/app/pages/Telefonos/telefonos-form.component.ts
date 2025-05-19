// telefonos-form.component.ts

import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
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
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ]
})
export class TelefonosFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  // User data and menu
  showUserMenu = false;
  userData: any = null;
  private userSub: any;  // Using any type since Firebase's Unsubscribe doesn't match Subscription

  // App data
  puebloGestionado = 'Figueruelas';
  telefonos$!: Observable<any[]>;
  form: FormGroup;
  editandoId: string | null = null;

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
    // Setup navbar indicator
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      const links = nav.querySelectorAll('.nav-link');

      const updateIndicator = (el: HTMLElement) => {
        indicator.style.width = `${el.offsetWidth}px`;
        indicator.style.left = `${el.offsetLeft}px`;
      };

      links.forEach(link => {
        if (link.classList.contains('active')) {
          updateIndicator(link as HTMLElement);
        }
        link.addEventListener('click', () => {
          links.forEach(lnk => lnk.classList.remove('active'));
          link.classList.add('active');
          updateIndicator(link as HTMLElement);
        });
      });

      // Update on window resize
      window.addEventListener('resize', () => {
        const activeLink = nav.querySelector('.nav-link.active') as HTMLElement;
        if (activeLink) updateIndicator(activeLink);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub();
  }

  async guardarTelefono() {
    if (this.form.invalid) {
      alert('Rellena correctamente los campos.');
      return;
    }

    const datos = this.form.value;
    try {
      if (this.editandoId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`
        );
        await updateDoc(docRef, datos);
        this.editandoId = null;
      } else {
        const ref = collection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos`
        );
        await addDoc(ref, datos);
      }
      this.form.reset();
    } catch (err) {
      console.error('Error guardando teléfono:', err);
      alert('Hubo un error al guardar. Revisa la consola.');
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
