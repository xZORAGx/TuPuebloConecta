import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatIconModule }      from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData, collection as fsCollection } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

import { addDoc, query, orderBy, onSnapshot, deleteDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

interface Telefono {
  id: string;
  nombre: string;
  numero: string;
  timestamp?: number;
}

@Component({
  selector: 'app-telefonos',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './telefonos.component.html',
  styleUrls: ['./telefonos.component.css']
})
export class TelefonosComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  formTelefono: FormGroup;
  cargando = false;
  mensajeExito: string | null = null;
  telefonos: Telefono[] = [];
  editandoId: string | null = null; // ID del teléfono que se está editando

  // Nav / user-dropdown state
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  puebloGestionado = 'Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.formTelefono = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Carga usuario para dropdown
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const uDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(uDoc).subscribe(data => {
        this.userData = data as UserWeb;
      });
    }

    // Escucha lista de teléfonos
    const refTelefonos = fsCollection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Telefonos`
    );
    onSnapshot(refTelefonos, snap => {
      this.telefonos = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          nombre: data['nombre'] || 'Sin nombre',
          numero: data['numero'] || 'Sin número',
          timestamp: data['timestamp'] || 0
        };
      }).sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar alfabéticamente
    });
  }

  ngAfterViewInit(): void {
    // Indicador deslizante en la navbar
    setTimeout(() => {
      const nav = this.navToolbar.nativeElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;
      
      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect(),
              nr = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left = `${r.left - nr.left}px`;
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
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // Toggle dropdown
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }
  
  onLogout() {
    this.router.navigate(['/']); // redirige a home
  }

  async guardarTelefono() {
    if (this.formTelefono.invalid) return;
    this.cargando = true;
    this.mensajeExito = null;

    const { nombre, numero } = this.formTelefono.value;

    try {
      if (this.editandoId) {
        // Actualizar teléfono existente
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`
        );
        await updateDoc(docRef, {
          nombre: nombre.trim(),
          numero: numero.trim()
        });
        this.mensajeExito = 'Teléfono actualizado correctamente.';
        this.editandoId = null;
      } else {
        // Crear nuevo teléfono
        const refTelefonos = fsCollection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos`
        );
        
        await addDoc(refTelefonos, {
          nombre: nombre.trim(),
          numero: numero.trim(),
          timestamp: Date.now()
        });
        this.mensajeExito = 'Teléfono agregado correctamente.';
      }
      
      this.formTelefono.reset();
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar el teléfono');
      this.mensajeExito = null;
    } finally {
      this.cargando = false;
    }
  }

  editarTelefono(telefono: Telefono) {
    this.editandoId = telefono.id;
    this.formTelefono.patchValue({
      nombre: telefono.nombre,
      numero: telefono.numero
    });
    this.mensajeExito = null;
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.formTelefono.reset();
    this.mensajeExito = null;
  }

  async eliminarTelefono(id: string, nombre: string) {
    const refDialog = this.dialog.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: { mensaje: `¿Eliminar el teléfono "${nombre}"?` },
      viewContainerRef: undefined
    });
    const ok = await refDialog.afterClosed().toPromise();
    if (!ok) return;

    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Telefonos/${id}`
      );
      await deleteDoc(docRef);
      alert('✅ Teléfono eliminado');
    } catch {
      alert('❌ Error al eliminar el teléfono');
    }
  }
}
