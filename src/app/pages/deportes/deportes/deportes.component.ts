import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatTabsModule }      from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatListModule }      from '@angular/material/list';
import { MatIconModule }      from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

interface Deporte  { id?: string; nombre: string; filtro: string; emoji: string; }
interface Partido  {
  id?: string;
  deporte: string;
  categoria: string;
  diaSemana: string;
  equipo1: string;
  equipo2: string;
  fecha: string;
  resultado: string;
}
interface Actividad { id?: string; titulo: string; imageUrl: string; }

@Component({
  selector: 'app-deportes',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
     MatToolbarModule, 
    MatExpansionModule
  ],
  templateUrl: './deportes.component.html',
  styleUrls: ['./deportes.component.css']
})
export class DeportesComponent implements OnInit {
  selectedFormTab = 0;
  selectedListTab = 0;

  formDeporte!: FormGroup;
  formPartido!: FormGroup;
  formActividad!: FormGroup;

  deportes$!: Observable<Deporte[]>;
  partidos$!: Observable<Partido[]>;
  actividades$!: Observable<Actividad[]>;

  private basePath = 'pueblos/Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.formDeporte = this.fb.group({
      nombre: ['', Validators.required],
      filtro: ['', Validators.required],
      emoji:  ['', Validators.required]
    });
    this.formPartido = this.fb.group({
      deporte:  ['', Validators.required],
      categoria: ['', Validators.required],
      diaSemana: ['', Validators.required],
      equipo1:   ['', Validators.required],
      equipo2:   ['', Validators.required],
      fecha:     ['', Validators.required],
      resultado: ['', Validators.required]
    });
    this.formActividad = this.fb.group({
      titulo:   ['', Validators.required],
      imageUrl: ['', Validators.required]
    });

    const colDep = collection(this.firestore, `${this.basePath}/Deportes`);
    const colPar = collection(this.firestore, `${this.basePath}/Partidos`);
    const colAct = collection(this.firestore, `${this.basePath}/Actividades`);

    this.deportes$    = collectionData(colDep, { idField: 'id' }) as Observable<Deporte[]>;
    this.partidos$    = collectionData(colPar, { idField: 'id' }) as Observable<Partido[]>;
    this.actividades$ = collectionData(colAct, { idField: 'id' }) as Observable<Actividad[]>;
  }

  onSubmitDeporte() {
    if (this.formDeporte.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Deportes`), this.formDeporte.value)
      .then(() => this.formDeporte.reset());
  }
  onSubmitPartido() {
    if (this.formPartido.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Partidos`), this.formPartido.value)
      .then(() => this.formPartido.reset());
  }
  onSubmitActividad() {
    if (this.formActividad.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Actividades`), this.formActividad.value)
      .then(() => this.formActividad.reset());
  }

  onDeleteDeporte(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Deportes/${id}`));
  }
  onDeletePartido(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Partidos/${id}`));
  }
  onDeleteActividad(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Actividades/${id}`));
  }
}
