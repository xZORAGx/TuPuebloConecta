import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, collection as fsCollection } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';

// Angular Material + Angular Common
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';

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
    MatLabel
  ],
  templateUrl: './crear-noticia.component.html',
  styleUrls: ['./crear-noticia.component.css']
})
export class CrearNoticiaComponent {
  formNoticia: FormGroup;
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  cargando = false;

  puebloGestionado: string = 'Figueruelas'; // Puedes hacerlo dinámico si ya tienes lógica

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth
  ) {
    this.formNoticia = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async publicarNoticia() {
    if (this.formNoticia.invalid) return;

    this.cargando = true;

    const titulo = this.formNoticia.value.titulo;
    const descripcion = this.formNoticia.value.descripcion;
    const timestamp = Date.now();
    let imagenURL = '';

    try {
      if (this.imagenFile) {
        const nombreArchivo = uuidv4();
        const ruta = `noticias/${nombreArchivo}`;
        const storageRef = ref(this.storage, ruta);
        await uploadBytes(storageRef, this.imagenFile);
        imagenURL = await getDownloadURL(storageRef);
      }

      const noticiasRef = fsCollection(this.firestore, `pueblos/${this.puebloGestionado}/Noticias`);
      await addDoc(noticiasRef, {
        titulo,
        descripcion,
        imagenURL,
        timestamp
      });

      this.formNoticia.reset();
      this.imagenPreview = null;
      this.imagenFile = null;
      alert('✅ Noticia publicada con éxito');
    } catch (error) {
      console.error('Error al publicar noticia:', error);
      alert('❌ Error al publicar la noticia');
    } finally {
      this.cargando = false;
    }
  }
}
