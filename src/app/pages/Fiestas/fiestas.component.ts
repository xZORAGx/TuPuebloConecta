import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  deleteDoc,
  DocumentReference,
  Query
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';

import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatCardModule }        from '@angular/material/card';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatExpansionModule }   from '@angular/material/expansion';
import { MatToolbarModule }     from '@angular/material/toolbar';

import { RouterModule, Router } from '@angular/router';
import { Auth }                 from '@angular/fire/auth';

interface Fiesta {
  id?: string;
  titulo: string;
  pdfUrl: string;
  storagePath: string;
  mimeType: string;
}

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-fiestas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatExpansionModule,
    MatToolbarModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fiestas.component.html',
  styleUrls: ['./fiestas.component.css']
})
export class FiestasComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('navToolbar', { static: true }) navEl!: ElementRef<HTMLElement>;

  showUserMenu = false;
  userData: UserWeb | null = null;
  private userSub?: Subscription;

  form: FormGroup;
  fiestas: Fiesta[] = [];
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  safePreviewUrl: SafeResourceUrl | null = null;
  uploading = false;
  private fiestasSub?: Subscription;
  private fsPath = 'pueblos/Figueruelas/Celebraciones';
  private lastActive: HTMLElement | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private sanitizer: DomSanitizer,
    public router: Router,
    private auth: Auth
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      file:   [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // 1) Cargar datos de usuario
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid) as DocumentReference<UserWeb>;
      this.userSub = docData<UserWeb>(userDoc).subscribe(d => this.userData = d ?? null);
    }

    // 2) Cargar listado de fiestas
    const colRef = collection(this.firestore, this.fsPath) as unknown as Query<Fiesta>;
    this.fiestasSub = collectionData<Fiesta>(colRef, { idField: 'id' })
      .subscribe(list => this.fiestas = list);
  }

  ngAfterViewInit(): void {
    // Solo inicializa eventos de hover/click
    setTimeout(() => {
      const nav = this.navEl.nativeElement;
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!nav || !links.length || !indicator) return;

      // Eventos hover
      links.forEach(link => {
        link.addEventListener('mouseenter', () => this.updateIndicator(link));
        link.addEventListener('mouseleave', () => {
          const curr = nav.querySelector('.nav-link.active') as HTMLElement;
          if (curr) this.updateIndicator(curr);
        });
      });
    }, 0);
  }

  ngAfterViewChecked(): void {
    // Siempre reposiciona el indicador tras cada cambio de vista
    const nav = this.navEl?.nativeElement;
    if (!nav) return;
    const active = nav.querySelector('.nav-link.active') as HTMLElement;
    if (active && active !== this.lastActive) {
      this.updateIndicator(active);
      this.lastActive = active;
    }
  }

  private updateIndicator(el: HTMLElement) {
    const nav = this.navEl.nativeElement;
    const indicator = nav.querySelector('.indicator') as HTMLElement;
    if (!el || !indicator) return;
    const r  = el.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    indicator.style.width = `${r.width}px`;
    indicator.style.left  = `${r.left - nr.left}px`;
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.fiestasSub?.unsubscribe();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onFileChange(event: Event): void {
    const inp = event.target as HTMLInputElement;
    if (!inp.files?.length) return;
    const file = inp.files[0];
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Solo PDF o imágenes permitidos.');
      inp.value = '';
      return;
    }
    this.selectedFile = file;
    this.form.get('file')!.setValue(file);
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
  }

  openPreview(): void {
    if (!this.previewUrl) return;
    window.open(this.previewUrl as string, '_blank');
  }

  upload(): void {
    if (this.form.invalid || !this.selectedFile) return;
    this.uploading = true;

    const titulo = this.form.value.titulo.trim();
    const file   = this.selectedFile!;
    const ts     = Date.now();
    const path   = `celebraciones/Figueruelas/${ts}_${file.name}`;
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      undefined,
      (err: any) => {
        console.error(err);
        this.uploading = false;
        alert('Error al subir el archivo');
      },
      async () => {
        try {
          const pdfUrl = await getDownloadURL(storageRef);
          // Aquí usamos addDoc en lugar de .add()
          await addDoc(collection(this.firestore, this.fsPath), {
            titulo,
            pdfUrl,
            storagePath: path,
            mimeType: file.type
          });
          this.form.reset();
          this.selectedFile = null;
          this.previewUrl = null;
        } catch (e) {
          console.error(e);
          alert('Error guardando en Firestore');
        } finally {
          this.uploading = false;
        }
      }
    );
  }

  delete(f: Fiesta): void {
    if (!f.id || !confirm(`¿Eliminar “${f.titulo}”?`)) return;
    // deleteDoc importado
    deleteDoc(doc(this.firestore, this.fsPath, f.id))
      .then(() => deleteObject(ref(this.storage, f.storagePath)))
      .catch((err: any) => {
        console.error(err);
        alert('Error al eliminar');
      });
  }

  viewPdf(url: string, ev: Event): void {
    ev.stopPropagation();
    window.open(url, '_blank');
  }
}
