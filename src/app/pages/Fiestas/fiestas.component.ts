import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

/* ---------- Firebase ---------- */
import {
  Firestore,
  collection, collectionData, addDoc,
  deleteDoc, doc, query, Query
} from '@angular/fire/firestore';
import {
  Storage,
  ref, uploadBytesResumable,
  getDownloadURL, deleteObject
} from '@angular/fire/storage';

/* ---------- Angular‑Material ---------- */
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule      } from '@angular/material/input';
import { MatButtonModule     } from '@angular/material/button';
import { MatIconModule       } from '@angular/material/icon';
import { MatCardModule       } from '@angular/material/card';
import { MatTooltipModule    } from '@angular/material/tooltip';
import { MatExpansionModule  } from '@angular/material/expansion';

interface Fiesta {
  id?: string;
  titulo: string;
  pdfUrl: string;
  storagePath: string;
  mimeType: string;
}

@Component({
  selector: 'app-fiestas',
  standalone: true,
  /* ------------ MÓDULOS IMPORTADOS (stand‑alone) ------------ */
  imports: [
    CommonModule,
    ReactiveFormsModule,
    /* Material */
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatTooltipModule,
    MatExpansionModule
  ],
  templateUrl: './fiestas.component.html',
  styleUrls: ['./fiestas.component.css']
})
export class FiestasComponent implements OnInit, OnDestroy {

  /* -------------------- PROPIEDADES -------------------- */
  form: FormGroup;
  fiestas: Fiesta[] = [];
  selectedFile: File | null = null;

  previewUrl: string | ArrayBuffer | null = null;   // para imagen local
  safePreviewUrl: SafeResourceUrl | null = null;    // pdf local seguro
  uploading = false;

  private sub?: Subscription;
  private fsPath = 'pueblos/Figueruelas/Celebraciones';   // colección

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      file:   [null, Validators.required]
    });
  }

  /* -------------------- CICLO DE VIDA -------------------- */
  ngOnInit(): void {
    const colRef = collection(this.firestore, this.fsPath) as unknown as Query<Fiesta>;
    this.sub = collectionData<Fiesta>(colRef, { idField: 'id' })
      .subscribe(list => this.fiestas = list);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /* -------------------- GESTIÓN ARCHIVO ------------------ */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) { return; }

    const file = input.files[0];
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Solo se permiten PDF o imágenes.');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.form.get('file')!.setValue(file);

    /* Vista previa inmediata */
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl     = reader.result;
      this.safePreviewUrl = this.sanitizer
                              .bypassSecurityTrustResourceUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  openPreview(): void {
    if (this.safePreviewUrl) { window.open(this.safePreviewUrl as string, '_blank'); }
  }

  /* ------------------------ SUBIR ------------------------ */
  upload(): void {
    if (this.form.invalid || !this.selectedFile) { return; }
    this.uploading = true;

    const titulo = this.form.value.titulo.trim();
    const file   = this.selectedFile;
    const ts     = Date.now();
    const storagePath = `celebraciones/Figueruelas/${ts}_${file.name}`;
    const storageRef  = ref(this.storage, storagePath);

    /* tarea subida */
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      undefined,
      err => {                   // error
        console.error(err);
        this.uploading = false;
        alert('Error al subir el archivo');
      },
      async () => {              // completado
        try {
          const pdfUrl = await getDownloadURL(storageRef);
          await addDoc(
            collection(this.firestore, this.fsPath),
            { titulo, pdfUrl, storagePath, mimeType: file.type }
          );
          /* reseteo formulario */
          this.form.reset();
          this.selectedFile = null;
          this.previewUrl = null;
          this.safePreviewUrl = null;
        } catch (e) {
          console.error(e);
          alert('Error al guardar en Firestore');
        } finally {
          this.uploading = false;
        }
      }
    );
  }

  /* ----------------------- ELIMINAR ---------------------- */
  delete(f: Fiesta): void {
    if (!f.id || !confirm(`¿Eliminar “${f.titulo}”?`)) { return; }

    deleteDoc(doc(this.firestore, this.fsPath, f.id))
      .then(() => deleteObject(ref(this.storage, f.storagePath)))
      .catch(err => {
        console.error(err);
        alert('Error al eliminar');
      });
  }

  /* --------- URL segura para PDFs en iframes remotos ------ */
  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
