import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
  ref as storageRefFromUrl
} from 'firebase/storage';
import {
  addDoc,
  collection as fsCollection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { register } from 'swiper/element/bundle';
import { ConfirmDialogComponent } from './confirm-dialog.component';

register();

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-crear-noticia',
  standalone: true,  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatToolbarModule
  ],
  templateUrl: './crear-noticia.component.html',
  styleUrls: ['./crear-noticia.component.css']
})
export class CrearNoticiaComponent implements OnInit, AfterViewInit, OnDestroy {
  formNoticia: FormGroup;
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  cargando = false;

  noticias: { id: string; titulo: string; timestamp: number }[] = [];
  puebloGestionado = 'Figueruelas';

  noticiaId: string | null = null;
  isEditMode = false;
  imagenURLAntigua = '';

  // Dropdown Usuario
  showUserMenu = false;
  userData: UserWeb | null = null;
  private userUnsub?: Unsubscribe;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    public auth: Auth,
    public router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this.formNoticia = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // 1) Suscripción al doc de usuario
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userUnsub = onSnapshot(userDoc, snap => {
        if (snap.exists()) {
          this.userData = snap.data() as UserWeb;
        }
      });
    }

    // 2) Modo edición si viene ID
    this.noticiaId = this.route.snapshot.paramMap.get('id');
    if (this.noticiaId) {
      this.isEditMode = true;
      this.loadNoticia(this.noticiaId);
    }

    // 3) Listado en tiempo real
    const noticiasRef = fsCollection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Noticias`
    );
    const q = query(noticiasRef, orderBy('timestamp', 'desc'));
    onSnapshot(q, snapshot => {
      this.noticias = snapshot.docs.map(d => ({
        id: d.id,
        titulo: d.data()['titulo'],
        timestamp: d.data()['timestamp']
      }));
    });
  }

  ngAfterViewInit(): void {
    // Indicador deslizante en la navbar
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
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
    }, 0);
  }

  ngOnDestroy(): void {
    this.userUnsub?.();
  }

  /** Carga datos si estamos editando */
  private async loadNoticia(id: string) {
    const docRef = doc(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Noticias/${id}`
    );
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data: any = snap.data();
      this.formNoticia.patchValue({
        titulo: data.titulo,
        descripcion: data.descripcion
      });
      this.imagenPreview = data.imagenURL || null;
      this.imagenURLAntigua = data.imagenURL || '';
    }
  }

  /** File input */
  onFileSelected(ev: any) {
    const file = ev.target.files[0];
    if (file) {
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.imagenPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  /** Dropdown usuario */
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  /** Navegación interna */
  entrar(titulo: string) {
    switch (titulo) {
      case 'Noticias':      this.router.navigate(['/crear-noticia']);   break;
      case 'Deportes':      this.router.navigate(['/deportes']);       break;
      case 'Instalaciones': this.router.navigate(['/instalaciones']);  break;
      case 'Fiestas':       this.router.navigate(['/fiestas']);       break;
      case 'Empleo':        this.router.navigate(['/empleo']);        break;
    }
  }
  irAListadoUsuarios() {
    const p = this.userData?.pueblo_gestionado;
    if (p) this.router.navigate(['/usuarios', p]);
  }
  verIncidencias() {
    const p = this.userData?.pueblo_gestionado;
    if (p) this.router.navigate([`/incidencias/${p}`]);
  }
  anadirTelefonos() {
    this.router.navigate(['/telefonos']);
  }

  /** Gestión de noticias */
  editarNoticia(id: string) {
    this.router.navigate(['/crear-noticia', id]);
  }
  verDetalle(id: string) {
    this.router.navigate(['/detalle-noticia', id]);
  }

  async publicarNoticia() {
    if (this.formNoticia.invalid) return;
    this.cargando = true;
    const { titulo, descripcion } = this.formNoticia.value;
    const timestamp = Date.now();
    let imagenURL = this.imagenURLAntigua;
    try {
      if (this.imagenFile) {
        const ruta = `noticias/${uuidv4()}`;
        const sRef = ref(this.storage, ruta);
        await uploadBytes(sRef, this.imagenFile);
        imagenURL = await getDownloadURL(sRef);
      }
      if (this.isEditMode && this.noticiaId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Noticias/${this.noticiaId}`
        );
        await updateDoc(docRef, { titulo, descripcion, imagenURL, timestamp });
        alert('✏️ Noticia actualizada');
      } else {
        const coll = fsCollection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Noticias`
        );
        await addDoc(coll, { titulo, descripcion, imagenURL, timestamp });
        alert('✅ Noticia publicada');
      }
      this.formNoticia.reset();
      this.imagenPreview = null;
      this.imagenFile = null;
      this.isEditMode = false;
      this.noticiaId = null;
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar noticia');
    } finally {
      this.cargando = false;
    }
  }

  async eliminarNoticia(id: string) {    const refDialog = this.dialog.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: { mensaje: '¿Eliminar noticia?' },
      viewContainerRef: undefined
    });
    const ok = await refDialog.afterClosed().toPromise();
    if (!ok) return;
    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Noticias/${id}`
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data: any = snap.data();
        const url = data.imagenURL;
        if (url) {
          const start = url.indexOf('/o/') + 3;
          const end = url.indexOf('?');
          const path = decodeURIComponent(url.substring(start, end));
          await deleteObject(storageRefFromUrl(this.storage, path));
        }
      }
      await deleteDoc(docRef);
      alert('🗑️ Noticia eliminada');
    } catch (err) {
      console.error(err);
      alert('❌ Error al eliminar noticia');
    }
  }
}
