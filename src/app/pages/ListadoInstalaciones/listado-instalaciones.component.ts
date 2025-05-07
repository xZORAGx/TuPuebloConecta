import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from '@angular/fire/firestore';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule      } from '@angular/material/input';
import { MatButtonModule     } from '@angular/material/button';
import { MatIconModule       } from '@angular/material/icon';
import { MatCardModule       } from '@angular/material/card';
import { MatListModule       } from '@angular/material/list';
import { MatExpansionModule  } from '@angular/material/expansion';

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

@Component({
  selector: 'app-listado-instalaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatExpansionModule
  ],
  templateUrl: './listado-instalaciones.component.html',
  styleUrls: ['./listado-instalaciones.component.css']
})
export class ListadoInstalacionesComponent implements OnInit {
  formInstalacion: FormGroup;
  instalaciones: Instalacion[] = [];
  cargando = false;

  isEditing = false;
  selectedId?: string;

  private path = 'pueblos/Figueruelas/Instalaciones';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router
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
    const colRef = collection(this.firestore, this.path);
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
        const docRef = doc(this.firestore, this.path, this.selectedId);
        await updateDoc(docRef, payload);
        this.isEditing = false;
        this.selectedId = undefined;
      } else {
        await addDoc(collection(this.firestore, this.path), payload);
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
    await deleteDoc(doc(this.firestore, this.path, id));
  }

  verDetalle(id?: string): void {
    if (!id) return;
    this.router.navigate(['/instalaciones', id]);
  }
}
