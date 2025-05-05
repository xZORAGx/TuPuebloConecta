import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { getDownloadURL, ref, uploadBytes, deleteObject, ref as storageRefFromUrl } from 'firebase/storage';
import { addDoc, collection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, collection as fsCollection } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatLabel } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component'; // Ajusta el path si es necesario

@Component({
  selector: 'app-crear-noticia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatError,
    MatLabel,
    MatDialogModule
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

  puebloGestionado: string = 'Figueruelas';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.formNoticia = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const noticiasRef = fsCollection(this.firestore, `pueblos/${this.puebloGestionado}/Noticias`);
    const q = query(noticiasRef, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
      this.noticias = snapshot.docs.map(doc => ({
        id: doc.id,
        titulo: doc.data()['titulo'],
        timestamp: doc.data()['timestamp']
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

  async publicarNoticia() {
    if (this.formNoticia.invalid) return;
    this.cargando = true;

    const { titulo, descripcion } = this.formNoticia.value;
    const timestamp = Date.now();
    let imagenURL = '';

    try {
      if (this.imagenFile) {
        const ruta = `noticias/${uuidv4()}`;
        const storageRef = ref(this.storage, ruta);
        await uploadBytes(storageRef, this.imagenFile);
        imagenURL = await getDownloadURL(storageRef);
      }

      const noticiasRef = fsCollection(this.firestore, `pueblos/${this.puebloGestionado}/Noticias`);
      await addDoc(noticiasRef, { titulo, descripcion, imagenURL, timestamp });

      this.formNoticia.reset();
      this.imagenPreview = null;
      this.imagenFile = null;
      alert('✅ Noticia publicada con éxito');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al publicar la noticia');
    } finally {
      this.cargando = false;
    }
  }

  verDetalle(id: string) {
    this.router.navigate(['/detalle-noticia', id]);
  }

  async eliminarNoticia(id: string) {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: { mensaje: '¿Deseas eliminar esta noticia permanentemente?' }
    });

    const confirmado = await confirmRef.afterClosed().toPromise();
    if (!confirmado) return;

    try {
      const docRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Noticias/${id}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const imagenURL = data['imagenURL'];

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
