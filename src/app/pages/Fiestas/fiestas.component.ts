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
  Query,
  orderBy,
  query
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import MatProgressSpinnerModule

import { RouterModule, Router } from '@angular/router';
import { Auth }                 from '@angular/fire/auth';

interface Fiesta {
  id?: string;
  titulo: string;
  pdfUrl: string;
  timestamp: number;
  mimeType: string;
  storagePath: string;
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
    RouterModule,
    MatProgressSpinnerModule // Add MatProgressSpinnerModule here
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
  mensajeExito: string | null = null; // Property for success message
  isEditMode = false; // Added for consistency, though not fully implemented for Fiestas edit yet
  private fiestasSub?: Subscription;
  private fsPath = ''; // Se actualizará basado en el pueblo
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
    // 1) Cargar datos de usuario y configurar fsPath
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userSub = docData(userDoc).subscribe(userData => {
        if (userData) {
          this.userData = {
            correo: userData['correo'] as string,
            pueblo_gestionado: userData['pueblo_gestionado'] as string
          };
          
          const pueblo = userData['pueblo_gestionado'] as string;
          if (pueblo) {
            this.fsPath = `pueblos/${pueblo}/Celebraciones`;
            this.loadFiestas();
          }
        }
      });
    } else {
      this.fsPath = `pueblos/Figueruelas/Celebraciones`;
      this.loadFiestas();
    }
  }

  private loadFiestas(): void {
    const colRef = collection(this.firestore, this.fsPath);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    
    this.fiestasSub = collectionData(q, { idField: 'id' })
      .subscribe(fiestas => {
        this.fiestas = fiestas.map(fiesta => ({
          id: fiesta['id'] as string,
          titulo: fiesta['titulo'] as string,
          pdfUrl: fiesta['pdfUrl'] as string,
          timestamp: fiesta['timestamp'] as number,
          mimeType: fiesta['mimeType'] as string || this.determinarMimeType(fiesta['pdfUrl'] as string),
          storagePath: fiesta['storagePath'] as string
        }));
      });
  }

  private determinarMimeType(url: string): string {
    // Determinar el tipo MIME basado en la extensión del archivo
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image/' + extension;
    return 'application/octet-stream';
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
    if (this.form.invalid || !this.selectedFile) {
      alert('Por favor, completa el título y selecciona un archivo');
      return;
    }

    this.uploading = true;
    this.mensajeExito = null;

    const titulo = this.form.value.titulo.trim();
    const file = this.selectedFile;
    const timestamp = Date.now();
    const storagePath = `celebraciones/${this.userData?.pueblo_gestionado || 'Figueruelas'}/${titulo}_${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;
    const storageRef = ref(this.storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Error al subir:', error);
        this.uploading = false;
        alert('Error al subir el archivo');
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          this.guardarEnFirestore(titulo, downloadURL, file.type, storagePath);
        });
      }
    );
  }

  private guardarEnFirestore(titulo: string, pdfUrl: string, mimeType: string, storagePath: string): void {
    const data: Fiesta = {
      titulo,
      pdfUrl,
      mimeType,
      storagePath,
      timestamp: Date.now()
    };

    const colRef = collection(this.firestore, this.fsPath);
    addDoc(colRef, data)
      .then(() => {
        this.form.reset();
        this.selectedFile = null;
        this.previewUrl = null;
        this.mensajeExito = 'Fiesta publicada correctamente.';
        this.uploading = false;
        setTimeout(() => this.mensajeExito = null, 3000);
      })
      .catch(error => {
        console.error('Error al guardar en Firestore:', error);
        this.uploading = false;
        alert('Error al guardar en la base de datos');
      });
  }

  delete(f: Fiesta): void {
    if (!f.id || !confirm(`¿Eliminar "${f.titulo}"?`)) return;

    // Primero eliminamos el documento de Firestore
    deleteDoc(doc(this.firestore, this.fsPath, f.id))
      .then(() => {
        // Si se elimina correctamente de Firestore, eliminamos el archivo
        const storageRef = ref(this.storage, f.pdfUrl);
        return deleteObject(storageRef);
      })
      .then(() => {
        console.log('Fiesta eliminada completamente');
      })
      .catch((error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la fiesta');
      });
  }

  viewPdf(url: string, ev: Event): void {
    ev.stopPropagation();
    window.open(url, '_blank');
  }
}
