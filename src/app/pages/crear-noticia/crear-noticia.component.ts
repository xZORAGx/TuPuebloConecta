import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getDownloadURL, ref, uploadBytes, deleteObject, ref as storageRefFromUrl } from 'firebase/storage';
import { addDoc, collection as fsCollection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({  
  selector: 'app-crear-noticia',  
  standalone: true,  
  imports: [    
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    ConfirmDialogComponent
  ],  
  templateUrl: './crear-noticia.component.html',  
  styleUrls: ['./crear-noticia.component.css']
})
export class CrearNoticiaComponent implements OnInit {
  formNoticia: FormGroup;
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  cargando = false;

  noticias: { id: string; titulo: string; timestamp: number }[] = [];
  puebloGestionado = 'Figueruelas';

  noticiaId: string | null = null;
  isEditMode = false;
  imagenURLAntigua = '';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this.formNoticia = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    // 1) Detectar modo edición si recibimos id en la ruta
    this.noticiaId = this.route.snapshot.paramMap.get('id');
    if (this.noticiaId) {
      this.isEditMode = true;
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Noticias/${this.noticiaId}`
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data: any = docSnap.data();
        this.formNoticia.patchValue({
          titulo: data.titulo,
          descripcion: data.descripcion
        });
        this.imagenPreview = data.imagenURL || null;
        this.imagenURLAntigua = data.imagenURL || '';
      }
    }

    // 2) Cargar listado de noticias
    const noticiasRef = fsCollection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Noticias`
    );
    const q = query(noticiasRef, orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.noticias = snapshot.docs.map((d) => ({
        id: d.id,
        titulo: d.data()['titulo'],
        timestamp: d.data()['timestamp']
      }));
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.imagenPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  editarNoticia(id: string) {
    this.router.navigate(['/crear-noticia', id]);
  }

  /**
   * Navega a la página de detalle de la noticia
   */
  verDetalle(id: string) {
    this.router.navigate(['/noticia', id]);
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
        const storageRef = ref(this.storage, ruta);
        await uploadBytes(storageRef, this.imagenFile);
        imagenURL = await getDownloadURL(storageRef);
      }

      if (this.isEditMode && this.noticiaId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Noticias/${this.noticiaId}`
        );
        await updateDoc(docRef, { titulo, descripcion, imagenURL, timestamp });
        alert('✏️ Noticia actualizada con éxito');
      } else {
        const noticiasRef = fsCollection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Noticias`
        );
        await addDoc(noticiasRef, { titulo, descripcion, imagenURL, timestamp });
        alert('✅ Noticia publicada con éxito');
      }

      this.formNoticia.reset();
      this.imagenPreview = null;
      this.imagenFile = null;
      this.isEditMode = false;
      this.noticiaId = null;
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al guardar la noticia');
    } finally {
      this.cargando = false;
    }
  }

  async eliminarNoticia(id: string) {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: { mensaje: '¿Deseas eliminar esta noticia permanentemente?' }
    });

    const confirmado = await confirmRef.afterClosed().toPromise();
    if (!confirmado) return;

    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Noticias/${id}`
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data: any = docSnap.data();
        const imagenURL = data.imagenURL;
        if (imagenURL) {
          const pathStart = imagenURL.indexOf('/o/') + 3;
          const pathEnd = imagenURL.indexOf('?');
          const path = decodeURIComponent(imagenURL.substring(pathStart, pathEnd));
          const storageRef = storageRefFromUrl(this.storage, path);
          await deleteObject(storageRef);
        }
      }
      await deleteDoc(docRef);
      alert('✅ Noticia eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la noticia:', error);
      alert('❌ Error al eliminar la noticia');
    }
  }
}
