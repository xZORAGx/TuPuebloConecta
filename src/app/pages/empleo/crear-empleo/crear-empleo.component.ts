import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import {
  Firestore,
  collection as fsCollection
} from '@angular/fire/firestore';
import {
  Storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';
import { Router } from '@angular/router';
import {
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-crear-empleo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ConfirmDialogComponent
  ],
  templateUrl: './crear-empleo.component.html',
  styleUrls: ['./crear-empleo.component.css']
})
export class CrearEmpleoComponent implements OnInit {
  formEmpleo: FormGroup;
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  cargando = false;
  empleos: { id: string; titulo: string; timestamp: number }[] = [];

  puebloGestionado = 'Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.formEmpleo = this.fb.group({
      titulo:      ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
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
      alert('✅ Empleo publicado con éxito');
    } catch {
      alert('❌ Error al publicar el empleo');
    } finally {
      this.cargando = false;
    }
  }

  verDetalle(id: string) {
    this.router.navigate(['/empleo', id]);
  }

  async eliminarEmpleo(id: string) {
    const refDialog = this.dialog.open(ConfirmDialogComponent, {
      data: { mensaje: '¿Eliminar esta oferta de empleo?' }
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
