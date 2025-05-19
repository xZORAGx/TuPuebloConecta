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
    MatToolbarModule
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

  isEditing = false;
  selectedId?: string;

  private basePath = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    public router: Router,
    public auth: Auth
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

  async publicarInstalacion(): Promise<void> {
    if (this.formInstalacion.get('titulo')?.invalid) return;
    this.cargando = true;
    const v = this.formInstalacion.value;

    // Construir payload
    const payload: any = { Titulo: v.titulo };

    // Invierno mañana
    if (v.inviernoMananaApertura || v.inviernoMananaCierre) {
      payload.HorarioInvierno_Manana_Apertura = v.inviernoMananaApertura;
      payload.HorarioInvierno_Manana_Cierre   = v.inviernoMananaCierre;
      // clave genérica para Android
      payload.HorarioInvierno_Apertura = v.inviernoMananaApertura;
      payload.HorarioInvierno_Cierre   = v.inviernoMananaCierre;
    }
    // Invierno tarde
    if (v.inviernoTardeApertura || v.inviernoTardeCierre) {
      payload.HorarioInvierno_Tarde_Apertura = v.inviernoTardeApertura;
      payload.HorarioInvierno_Tarde_Cierre   = v.inviernoTardeCierre;
      // clave genérica de tarde
      payload.HorarioTarde_Apertura = v.inviernoTardeApertura;
      payload.HorarioTarde_Cierre   = v.inviernoTardeCierre;
    }
    // Verano mañana
    if (v.veranoMananaApertura || v.veranoMananaCierre) {
      payload.HorarioVerano_Manana_Apertura = v.veranoMananaApertura;
      payload.HorarioVerano_Manana_Cierre   = v.veranoMananaCierre;
      // clave genérica para Android
      payload.HorarioVerano_Apertura = v.veranoMananaApertura;
      payload.HorarioVerano_Cierre   = v.veranoMananaCierre;
    }
    // Verano tarde
    if (v.veranoTardeApertura || v.veranoTardeCierre) {
      payload.HorarioVerano_Tarde_Apertura = v.veranoTardeApertura;
      payload.HorarioVerano_Tarde_Cierre   = v.veranoTardeCierre;
      // genérica tarde (sobrescribe si se desea)
      payload.HorarioTarde_Apertura = v.veranoTardeApertura;
      payload.HorarioTarde_Cierre   = v.veranoTardeCierre;
    }

    try {
      if (this.isEditing && this.selectedId) {
        const docRef = doc(this.firestore, `${this.basePath}/Instalaciones`, this.selectedId);
        await updateDoc(docRef, payload);
        this.isEditing = false;
        this.selectedId = undefined;
      } else {
        await addDoc(collection(this.firestore, `${this.basePath}/Instalaciones`), payload);
      }
      this.formInstalacion.reset();
    } finally {
      this.cargando = false;
    }
  }

  onEdit(inst: Instalacion): void {
    this.isEditing = true;
    this.selectedId = inst.id;
    this.formInstalacion.patchValue({
      titulo: inst.titulo,
      inviernoMananaApertura: inst.inviernoMananaApertura || '',
      inviernoMananaCierre:   inst.inviernoMananaCierre   || '',
      inviernoTardeApertura:  inst.inviernoTardeApertura  || '',
      inviernoTardeCierre:    inst.inviernoTardeCierre    || '',
      veranoMananaApertura:   inst.veranoMananaApertura   || '',
      veranoMananaCierre:     inst.veranoMananaCierre     || '',
      veranoTardeApertura:    inst.veranoTardeApertura    || '',
      veranoTardeCierre:      inst.veranoTardeCierre      || ''
    });
  }

  async eliminarInstalacion(id?: string): Promise<void> {
    if (!id) return;
    await deleteDoc(doc(this.firestore, `${this.basePath}/Instalaciones`, id));
  }

  verDetalle(id?: string): void {
    if (!id) return;
    this.router.navigate(['/instalaciones', id]);
  }
}
