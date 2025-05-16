import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatListModule }      from '@angular/material/list';
import { MatIconModule }      from '@angular/material/icon';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatSelectModule }    from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc
} from '@angular/fire/firestore';

import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';

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
interface Actividad { id?: string; titulo: string; imageUrl: string; storagePath?: string; }

@Component({
  selector: 'app-deportes',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './deportes.component.html',
  styleUrls: ['./deportes.component.css']
})
export class DeportesComponent implements OnInit, AfterViewInit {
  formDeporte!: FormGroup;
  formPartido!: FormGroup;
  formActividad!: FormGroup;

  deportes$!: Observable<Deporte[]>;
  partidos$!: Observable<Partido[]>;
  actividades$!: Observable<Actividad[]>;

  categoriaOptions = ['Pre-Benjamín','Benjamín','Alevín','Infantil','Cadete','Juvenil','Senior'];
  diaOptions       = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];

  currentPartidoId: string | null = null;
  isEditingPartido = false;

  uploading = false;
  selectedPreview: string | null = null;

  private basePath = 'pueblos/Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage
  ) {}

  ngOnInit(): void {
    // Formularios
    this.formDeporte = this.fb.group({
      nombre: ['', Validators.required],
      filtro: ['', Validators.required],
      emoji:  ['', Validators.required]
    });
    this.formPartido = this.fb.group({
      deporte:   ['', Validators.required],
      categoria: ['', Validators.required],
      diaSemana: ['', Validators.required],
      equipo1:   ['', Validators.required],
      equipo2:   ['', Validators.required],
      fecha:     ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
      resultado: ['', [Validators.required, Validators.pattern(/^\d+\s-\s\d+$/)]]
    });
    this.formActividad = this.fb.group({
      titulo:      ['', Validators.required],
      imageUrl:    ['', Validators.required],
      storagePath: ['']
    });

    // Observables
    this.deportes$ = collectionData(
      collection(this.firestore, `${this.basePath}/Deportes`),
      { idField: 'id' }
    ) as Observable<Deporte[]>;

    this.partidos$ = collectionData(
      collection(this.firestore, `${this.basePath}/Partidos`),
      { idField: 'id' }
    ) as Observable<Partido[]>;

    this.actividades$ = collectionData(
      collection(this.firestore, `${this.basePath}/Actividades`),
      { idField: 'id' }
    ) as Observable<Actividad[]>;
  }

  ngAfterViewInit(): void {
    // Indicador nav
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;
      function updateIndicator(el: HTMLElement) {
        const r = el.getBoundingClientRect(), p = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left  = `${r.left - p.left}px`;
      }
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
    }, 0);
  }

  /* DEPORTES */
  onSubmitDeporte() {
    if (this.formDeporte.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Deportes`), this.formDeporte.value)
      .then(() => this.formDeporte.reset());
  }
  onDeleteDeporte(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Deportes/${id}`));
  }

  /* PARTIDOS */
  async onSubmitPartido() {
    if (this.formPartido.invalid) return;
    const data = this.formPartido.value;
    if (this.isEditingPartido && this.currentPartidoId) {
      await updateDoc(doc(this.firestore, `${this.basePath}/Partidos/${this.currentPartidoId}`), data);
    } else {
      await addDoc(collection(this.firestore, `${this.basePath}/Partidos`), data);
    }
    this.formPartido.reset();
    this.isEditingPartido = false;
    this.currentPartidoId = null;
  }
  onEditPartido(p: Partido) {
    this.formPartido.patchValue(p);
    this.isEditingPartido = true;
    this.currentPartidoId = p.id ?? null;
  }
  cancelEditPartido() {
    this.formPartido.reset();
    this.isEditingPartido = false;
    this.currentPartidoId = null;
  }
  onDeletePartido(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Partidos/${id}`));
  }
  onDateInput(e: any) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0,2)+'/'+v.slice(2);
    if (v.length > 5) v = v.slice(0,5)+'/'+v.slice(5,9);
    this.formPartido.patchValue({ fecha: v }, { emitEvent: false });
  }
  onResultInput(e: any) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 1) v = v[0]+' - '+v[1];
    this.formPartido.patchValue({ resultado: v }, { emitEvent: false });
  }

  /* ACTIVIDADES */
  async onFileSelected(e: any) {
    const file: File = e.target.files[0];
    if (!file) return;
    this.selectedPreview = URL.createObjectURL(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext!=='jpg' && ext!=='jpeg') {
      alert('Solo podéis subir archivos JPG.');
      this.selectedPreview = null;
      return;
    }
    this.uploading = true;
    const path = `actividades/${Date.now()}_${file.name}`;
    const storageRefObj = ref(this.storage, path);
    await uploadBytes(storageRefObj, file);
    const url = await getDownloadURL(storageRefObj);
    this.formActividad.patchValue({ imageUrl: url, storagePath: path });
    this.uploading = false;
  }
  onSubmitActividad() {
    if (this.formActividad.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Actividades`), this.formActividad.value)
      .then(() => {
        this.formActividad.reset();
        this.selectedPreview = null;
      });
  }
  async onDeleteActividad(id?: string) {
    if (!id) return;
    const docRef = doc(this.firestore, `${this.basePath}/Actividades/${id}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Actividad;
      if (data.storagePath) {
        await deleteObject(ref(this.storage, data.storagePath));
      }
    }
    await deleteDoc(docRef);
    this.selectedPreview = null;
  }
}
