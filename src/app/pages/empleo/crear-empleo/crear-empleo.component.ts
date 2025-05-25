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
import { Storage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Subscription } from 'rxjs';

import { addDoc, query, orderBy, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-crear-empleo',
  standalone: true,  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  templateUrl: './crear-empleo.component.html',
  styleUrls: ['./crear-empleo.component.css']
})
export class CrearEmpleoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('navToolbar') navToolbar!: ElementRef;

  formEmpleo: FormGroup;
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  cargando = false;
  mensajeExito: string | null = null;
  empleos: { id: string; titulo: string; timestamp: number }[] = [];

  // Nav / user-dropdown state
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  // Flag para edición, si en el futuro quisieras reusar
  isEditMode = false;

  puebloGestionado = 'Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.formEmpleo = this.fb.group({
      titulo:      ['', Validators.required],
      descripcion: ['', Validators.required]
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

    // Escucha lista de empleos
    const refEmpleos = fsCollection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Empleo`
    );
    const q = query(refEmpleos, orderBy('timestamp', 'desc'));
    onSnapshot(q, snap =>
      this.empleos = snap.docs.map(d => ({
        id: d.id,
        titulo: d.data()['titulo'],
        timestamp: d.data()['timestamp']
      }))
    );
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

  onFileSelected(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagenPreview = reader.result;
    reader.readAsDataURL(file);
  }

  async publicarEmpleo() {
    if (this.formEmpleo.invalid) return;
    this.cargando = true;
    this.mensajeExito = null;

    const { titulo, descripcion } = this.formEmpleo.value;
    const timestamp = Date.now();
    let imagenURL = '';

    try {
      if (this.imagenFile) {
        const path = `empleos/${uuidv4()}`;
        const sRef = storageRef(this.storage, path);
        await uploadBytes(sRef, this.imagenFile);
        imagenURL = await getDownloadURL(sRef);
      }
      const refEmpleos = fsCollection(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Empleo`
      );
      await addDoc(refEmpleos, { titulo, descripcion, imagenURL, timestamp });
      this.formEmpleo.reset();
      this.imagenPreview = null;
      this.imagenFile = null;
      this.isEditMode = false;
      // alert('✅ Empleo publicado con éxito');
      this.mensajeExito = 'Oferta de empleo publicada correctamente.';
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('❌ Error al publicar el empleo');
      this.mensajeExito = null;
    } finally {
      this.cargando = false;
    }
  }

  verDetalle(id: string) {
    this.router.navigate(['/empleo', id]);
  }

  async eliminarEmpleo(id: string) {    const refDialog = this.dialog.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: { mensaje: '¿Eliminar esta oferta de empleo?' },
      viewContainerRef: undefined
    });
    const ok = await refDialog.afterClosed().toPromise();
    if (!ok) return;

    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Empleo/${id}`
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const url = snap.data()['imagenURL'];
        if (url) {
          const start = url.indexOf('/o/') + 3;
          const end   = url.indexOf('?');
          const path  = decodeURIComponent(url.substring(start, end));
          await deleteObject(storageRef(this.storage, path));
        }
      }
      await deleteDoc(docRef);
      alert('✅ Empleo eliminado');
    } catch {
      alert('❌ Error al eliminar el empleo');
    }
  }
}
