import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCardModule }      from '@angular/material/card';
import { MatListModule }      from '@angular/material/list';
import { MatIconModule }      from '@angular/material/icon';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatSelectModule }    from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

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

import { Auth } from '@angular/fire/auth';
import { docData } from '@angular/fire/firestore';
import { Subscription, Observable } from 'rxjs';

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
  fechaExpiracion: Date;
}
interface Actividad { 
  id?: string; 
  titulo: string; 
  imageUrl: string; 
  storagePath?: string;
  fechaExpiracion: Date;
}

// Para los datos del dropdown de usuario
interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

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
export class DeportesComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── Menú Usuario ───
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  // ─── Formularios ───
  formDeporte!: FormGroup;
  formPartido!: FormGroup;
  formActividad!: FormGroup;

  // ─── Observables ───
  deportes$!: Observable<Deporte[]>;
  partidos$!: Observable<Partido[]>;
  actividades$!: Observable<Actividad[]>;

  categoriaOptions = ['Pre-Benjamín','Benjamín','Alevín','Infantil','Cadete','Juvenil','Senior'];
  diaOptions       = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];

  currentPartidoId: string | null = null;
  isEditingPartido = false;
  uploading = false;
  selectedPreview: string | null = null;
  isEditMode = false;
  partidoIdToEdit: string | null = null;
  cargando = false;
  mensajeExito: string | null = null;

  private basePath = 'pueblos/Figueruelas';

  constructor(
    private fb: FormBuilder,
    public router: Router, // Cambiado a public para acceso en plantilla
    public auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // ─── Cargar datos usuario ───
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(userDoc).subscribe(data => {
        this.userData = data as UserWeb;
      });
    }

    // ─── Inicializar formularios ───
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

    // ─── Cargar listas ───
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
    // Indicador deslizante de la navbar (igual que antes)
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;
      const updateIndicator = (el: HTMLElement) => {
        const r = el.getBoundingClientRect(), p = nav.getBoundingClientRect();
        indicator.style.width = `${r.width}px`;
        indicator.style.left  = `${r.left - p.left}px`;
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
    }, 0);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // ─── Menú Usuario ───
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }
  onLogout(): void {
    this.auth.signOut().then(() => this.router.navigate(['/']));
  }

  // ─── DEPORTES ───
  onSubmitDeporte() {
    if (this.formDeporte.invalid) return;
    addDoc(collection(this.firestore, `${this.basePath}/Deportes`), this.formDeporte.value)
      .then(() => this.formDeporte.reset());
  }
  onDeleteDeporte(id?: string) {
    if (!id) return;
    deleteDoc(doc(this.firestore, `${this.basePath}/Deportes/${id}`));
  }

  // ─── PARTIDOS ───
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
  publicarPartido(): void {
    if (this.formPartido.invalid) {
      this.snackBar.open('Por favor, complete todos los campos obligatorios y asegúrese que los formatos son correctos.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.cargando = true;
    this.mensajeExito = null;

    const partidoData = this.formPartido.value;
    
    // Añadir fecha de expiración (1 mes)
    const fechaExpiracion = new Date();
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 1);
    partidoData.fechaExpiracion = fechaExpiracion;
    
    const partidosCollectionPath = `${this.basePath}/Partidos`;
    let operationPromise: Promise<any>;

    if (this.isEditMode && this.partidoIdToEdit) {
      const docRef = doc(this.firestore, partidosCollectionPath, this.partidoIdToEdit);
      operationPromise = updateDoc(docRef, partidoData);
    } else {
      const colRef = collection(this.firestore, partidosCollectionPath);
      operationPromise = addDoc(colRef, partidoData);
    }

    operationPromise.then(() => {
      this.mensajeExito = this.isEditMode ? 'Partido actualizado con éxito.' : 'Partido creado con éxito.';
      this.formPartido.reset();
      Object.keys(this.formPartido.controls).forEach(key => {
        this.formPartido.get(key)?.markAsPristine();
        this.formPartido.get(key)?.markAsUntouched();
      });
      this.formPartido.updateValueAndValidity();

      if (this.isEditMode) {
        this.isEditMode = false;
        this.partidoIdToEdit = null;
      }
      setTimeout(() => { this.mensajeExito = null; }, 3000);
    }).catch(error => {
      console.error(this.isEditMode ? "Error al actualizar el partido: " : "Error al crear el partido: ", error);
      this.snackBar.open(this.isEditMode ? 'Error al actualizar el partido.' : 'Error al crear el partido.', 'Cerrar', { duration: 3000 });
      this.mensajeExito = null;
    }).finally(() => {
      this.cargando = false;
    });
  }

  editPartido(partido: Partido): void {
    this.isEditMode = true;
    this.partidoIdToEdit = partido.id!;
    this.formPartido.patchValue({
      deporte: partido.deporte,
      categoria: partido.categoria,
      diaSemana: partido.diaSemana,
      equipo1: partido.equipo1,
      equipo2: partido.equipo2,
      fecha: partido.fecha,
      resultado: partido.resultado
    });
    // Consider scrolling to the form if it's not in view
    // Example: document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.partidoIdToEdit = null;
    this.formPartido.reset();
    Object.keys(this.formPartido.controls).forEach(key => {
      this.formPartido.get(key)?.markAsPristine();
      this.formPartido.get(key)?.markAsUntouched();
    });
    this.formPartido.updateValueAndValidity();
  }

  // ─── ACTIVIDADES ───
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
  }  onSubmitActividad() {
    if (this.formActividad.invalid) return;
    
    // Añadir fecha de expiración (3 meses)
    const actividadData = this.formActividad.value;
    const fechaExpiracion = new Date();
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 3);
    actividadData.fechaExpiracion = fechaExpiracion;
    
    addDoc(collection(this.firestore, `${this.basePath}/Actividades`), actividadData)
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
      const storagePath = data.storagePath;
      if (storagePath) {
        const imgRef = ref(this.storage, storagePath);
        deleteObject(imgRef).catch(error => console.error('Error al eliminar la imagen del storage:', error));
      }
      deleteDoc(docRef);
    }
  }
}
