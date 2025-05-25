import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  docData
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule      } from '@angular/material/input';
import { MatButtonModule     } from '@angular/material/button';
import { MatIconModule       } from '@angular/material/icon';
import { MatCardModule       } from '@angular/material/card';
import { MatListModule       } from '@angular/material/list';
import { MatExpansionModule  } from '@angular/material/expansion';
import { MatToolbarModule    } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Instalacion {
  id?: string;
  titulo: string;
  inviernoMananaApertura?: string;
  inviernoMananaCierre?:   string;
  inviernoTardeApertura?:  string;
  inviernoTardeCierre?:    string;
  veranoMananaApertura?:   string;
  veranoMananaCierre?:     string;
  veranoTardeApertura?:    string;
  veranoTardeCierre?:      string;
}

// Para los datos del dropdown de usuario
interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-listado-instalaciones',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatExpansionModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './listado-instalaciones.component.html',
  styleUrls: ['./listado-instalaciones.component.css']
})
export class ListadoInstalacionesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  // ─── Menú Usuario ───
  showDropdown = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  // ─── Datos y estado ───
  formInstalacion: FormGroup;
  instalaciones: Instalacion[] = [];
  cargando = false;
  mensajeExito: string | null = null;

  isEditing = false;
  selectedId?: string;

  private basePath = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    public router: Router,
    public auth: Auth,
    private snackBar: MatSnackBar
  ) {
    this.formInstalacion = this.fb.group({
      titulo: ['', Validators.required],
      inviernoMananaApertura: [''],
      inviernoMananaCierre:   [''],
      inviernoTardeApertura:  [''],
      inviernoTardeCierre:    [''],
      veranoMananaApertura:   [''],
      veranoMananaCierre:     [''],
      veranoTardeApertura:    [''],
      veranoTardeCierre:      ['']
    });
  }

  ngOnInit(): void {
    // ─── Cargar datos usuario ───
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(userDoc).subscribe(data => {
        this.userData = data as UserWeb;
        this.basePath = `pueblos/${this.userData.pueblo_gestionado}`;
        
        // Una vez tenemos el pueblo, cargar instalaciones
        const colRef = collection(this.firestore, `${this.basePath}/Instalaciones`);
        collectionData(colRef, { idField: 'id' })
          .subscribe((docs: any[]) => {
            this.instalaciones = docs.map(d => ({
              id: d.id,
              titulo: d.Titulo,
              inviernoMananaApertura: d.HorarioInvierno_Manana_Apertura,
              inviernoMananaCierre:   d.HorarioInvierno_Manana_Cierre,
              inviernoTardeApertura:  d.HorarioInvierno_Tarde_Apertura,
              inviernoTardeCierre:    d.HorarioInvierno_Tarde_Cierre,
              veranoMananaApertura:   d.HorarioVerano_Manana_Apertura,
              veranoMananaCierre:     d.HorarioVerano_Manana_Cierre,
              veranoTardeApertura:    d.HorarioVerano_Tarde_Apertura,
              veranoTardeCierre:      d.HorarioVerano_Tarde_Cierre
            }));
          });
      });
    }
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
      });
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.auth.signOut().then(() => this.router.navigate(['/']));
  }

  publicarInstalacion(): void {
    if (this.formInstalacion.invalid) {
      // Optionally, notify the user that the form is invalid if not relying solely on button's disabled state
      this.snackBar.open('Por favor, complete todos los campos obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;
    this.mensajeExito = null;
    const v = this.formInstalacion.value;

    const payload: any = { Titulo: v.titulo };

    if (v.inviernoMananaApertura || v.inviernoMananaCierre) {
      payload.HorarioInvierno_Manana_Apertura = v.inviernoMananaApertura;
      payload.HorarioInvierno_Manana_Cierre   = v.inviernoMananaCierre;
      payload.HorarioInvierno_Apertura = v.inviernoMananaApertura;
      payload.HorarioInvierno_Cierre   = v.inviernoMananaCierre;
    }
    if (v.inviernoTardeApertura || v.inviernoTardeCierre) {
      payload.HorarioInvierno_Tarde_Apertura = v.inviernoTardeApertura;
      payload.HorarioInvierno_Tarde_Cierre   = v.inviernoTardeCierre;
      payload.HorarioTarde_Apertura = v.inviernoTardeApertura;
      payload.HorarioTarde_Cierre   = v.inviernoTardeCierre;
    }
    if (v.veranoMananaApertura || v.veranoMananaCierre) {
      payload.HorarioVerano_Manana_Apertura = v.veranoMananaApertura;
      payload.HorarioVerano_Manana_Cierre   = v.veranoMananaCierre;
      if (!payload.HorarioInvierno_Apertura && !payload.HorarioInvierno_Cierre) { // Prioritize invierno if both set
        payload.HorarioVerano_Apertura = v.veranoMananaApertura;
        payload.HorarioVerano_Cierre   = v.veranoMananaCierre;
      }
    }
    if (v.veranoTardeApertura || v.veranoTardeCierre) {
      payload.HorarioVerano_Tarde_Apertura = v.veranoTardeApertura;
      payload.HorarioVerano_Tarde_Cierre   = v.veranoTardeCierre;
      if (!payload.HorarioTarde_Apertura && !payload.HorarioTarde_Cierre) { // Prioritize invierno if both set
        payload.HorarioTarde_Apertura = v.veranoTardeApertura;
        payload.HorarioTarde_Cierre   = v.veranoTardeCierre;
      }
    }

    const operationPromise = this.isEditing && this.selectedId
      ? updateDoc(doc(this.firestore, `${this.basePath}/Instalaciones/${this.selectedId}`), payload)
      : addDoc(collection(this.firestore, `${this.basePath}/Instalaciones`), payload);

    operationPromise.then(() => {
      this.mensajeExito = this.isEditing ? 'Instalación actualizada con éxito.' : 'Instalación creada con éxito.';
      this.formInstalacion.reset();
      Object.keys(this.formInstalacion.controls).forEach(key => { // Mark as pristine and untouched
        this.formInstalacion.get(key)?.markAsPristine();
        this.formInstalacion.get(key)?.markAsUntouched();
      });
      this.formInstalacion.updateValueAndValidity();


      if (this.isEditing) {
        this.isEditing = false;
        this.selectedId = undefined;
      }
      setTimeout(() => { this.mensajeExito = null; }, 3000);
    }).catch(error => {
      console.error(this.isEditing ? "Error al actualizar la instalación: " : "Error al crear la instalación: ", error);
      this.snackBar.open(this.isEditing ? 'Error al actualizar la instalación.' : 'Error al crear la instalación.', 'Cerrar', { duration: 3000 });
      this.mensajeExito = null;
    }).finally(() => {
      this.cargando = false;
    });
  }

  editInstalacion(instalacion: Instalacion): void {
    this.isEditing = true;
    this.selectedId = instalacion.id;
    this.formInstalacion.patchValue({
      titulo: instalacion.titulo,
      inviernoMananaApertura: instalacion.inviernoMananaApertura || '',
      inviernoMananaCierre:   instalacion.inviernoMananaCierre   || '',
      inviernoTardeApertura:  instalacion.inviernoTardeApertura  || '',
      inviernoTardeCierre:    instalacion.inviernoTardeCierre    || '',
      veranoMananaApertura:   instalacion.veranoMananaApertura   || '',
      veranoMananaCierre:     instalacion.veranoMananaCierre     || '',
      veranoTardeApertura:    instalacion.veranoTardeApertura    || '',
      veranoTardeCierre:      instalacion.veranoTardeCierre      || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedId = undefined;
    this.formInstalacion.reset();
    Object.keys(this.formInstalacion.controls).forEach(key => {
        this.formInstalacion.get(key)?.markAsPristine();
        this.formInstalacion.get(key)?.markAsUntouched();
    });
    this.formInstalacion.updateValueAndValidity();
  }

  async deleteInstalacion(id: string): Promise<void> {
    if (!id) return;
    // Confirmation dialog would be good here
    this.cargando = true; // Indicate loading for delete operation
    try {
      await deleteDoc(doc(this.firestore, `${this.basePath}/Instalaciones/${id}`));
      this.snackBar.open('Instalación eliminada con éxito.', 'Cerrar', { duration: 3000 });
      // The list will update automatically due to collectionData subscription
    } catch (error) {
      console.error("Error al eliminar la instalación: ", error);
      this.snackBar.open('Error al eliminar la instalación.', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargando = false;
    }
  }
}
