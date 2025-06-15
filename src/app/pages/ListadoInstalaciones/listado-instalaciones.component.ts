import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
  Storage
} from '@angular/fire/storage';
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
  Unsubscribe,
  Firestore
} from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Auth } from '@angular/fire/auth';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

interface Horario {
  apertura: string;
  cierre: string;
}

interface Instalacion {
  id?: string;
  titulo: string;
  descripcion?: string;
  imagenUrl?: string;
  horarios?: {
    [key: string]: Horario | undefined;
  };
  timestamp?: number;
  [key: string]: any; // Para permitir campos dinámicos para Firestore
}

@Component({
  selector: 'app-listado-instalaciones',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './listado-instalaciones.component.html',
  styleUrls: ['./listado-instalaciones.component.css']
})
export class ListadoInstalacionesComponent implements OnInit, AfterViewInit, OnDestroy {
  // Formulario para la instalación
  formInstalacion: FormGroup;

  // Estado de la interfaz
  cargando = false;
  mensajeExito: string | null = null;
  showDropdown = false;
  isEditing = false;

  // Datos
  instalaciones: Instalacion[] = [];
  userData: UserWeb | null = null;
  puebloGestionado = 'Figueruelas';  // Valor predeterminado
  basePath = '';
  
  // Gestión de imagen
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  imagePreview: string | null = null;
  currentImageUrl: string | null = null;
  currentInstalacionId: string | null = null;

  // Observables
  private userUnsub?: Unsubscribe;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    public auth: Auth,
    public router: Router
  ) {
    // Inicializar el formulario
    this.formInstalacion = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      // Inicializar campos de horario para cada día
      apertura_lunes: [''],
      cierre_lunes: [''],
      apertura_martes: [''],
      cierre_martes: [''],
      apertura_miércoles: [''],
      cierre_miércoles: [''],
      apertura_jueves: [''],
      cierre_jueves: [''],
      apertura_viernes: [''],
      cierre_viernes: [''],
      apertura_sábado: [''],
      cierre_sábado: [''],
      apertura_domingo: [''],
      cierre_domingo: [''],
    });
  }

  ngOnInit(): void {
    // Inicializar basePath con el valor predeterminado
    this.basePath = `pueblos/${this.puebloGestionado}`;
    
    // Obtener datos del usuario autenticado
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userUnsub = onSnapshot(userDoc, snap => {
        if (snap.exists()) {
          this.userData = snap.data() as UserWeb;
          if (this.userData?.pueblo_gestionado) {
            this.puebloGestionado = this.userData.pueblo_gestionado;
            this.basePath = `pueblos/${this.puebloGestionado}`;
            // Cargar instalaciones después de tener el pueblo
            this.loadInstalaciones();
          }
        }
      });
    } else {
      // Usar valor por defecto si no hay usuario
      this.loadInstalaciones();
    }
  }

  ngAfterViewInit(): void {
    // Indicador deslizante en la navbar
    setTimeout(() => {
      const nav = document.querySelector('.nav-toolbar') as HTMLElement;
      if (!nav) return;
      
      const links = Array.from(nav.querySelectorAll('.nav-link')) as HTMLElement[];
      const indicator = nav.querySelector('.indicator') as HTMLElement;
      if (!links.length || !indicator) return;
      
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
    if (this.userUnsub) {
      this.userUnsub();
    }
  }

  // Cargar instalaciones desde Firestore
  private loadInstalaciones(): void {
    const instalacionesRef = fsCollection(
      this.firestore,
      `${this.basePath}/Instalaciones`
    );
    
    const q = query(instalacionesRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, snapshot => {
      this.instalaciones = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data['titulo'],
          descripcion: data['descripcion'],
          imagenUrl: data['imagenUrl'],
          horarios: data['horarios'],
          timestamp: data['timestamp']
        };
      });
    }, error => {
      console.error('Error cargando instalaciones:', error);
    });
  }

  // Gestionar la selección de archivos
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      
      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  // Eliminar la imagen seleccionada
  removeImage(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.imagePreview = null;
  }

  // Método auxiliar para comprimir imagen
private async compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        // Mantener la relación de aspecto pero reducir el tamaño si es necesario
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          0.5  // Calidad JPEG al 50% como en Android
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
}

private async uploadImage(file: File): Promise<string> {
  try {
    // Generar nombre único para la imagen
    const nombreImagen = `${uuidv4()}.jpg`;
    const storageRef = ref(this.storage, `instalaciones/${nombreImagen}`);

    // Comprimir la imagen
    const compressedImageBlob = await this.compressImage(file);
    
    // Subir imagen comprimida
    await uploadBytes(storageRef, compressedImageBlob);
    
    // Obtener y retornar la URL de descarga
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
}

private async deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    // Extraer el nombre del archivo de la URL
    const storageRef = ref(this.storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    throw error;
  }
}

private resetForm(): void {
  this.formInstalacion.reset();
  this.selectedFile = null;
  this.selectedFileName = null;
  this.imagePreview = null;
  this.isEditing = false;
  this.currentInstalacionId = null;
  this.currentImageUrl = null;
}

async publicarInstalacion(): Promise<void> {
  if (this.formInstalacion.invalid) {
    alert('Por favor, completa todos los campos requeridos');
    return;
  }

  if (!this.selectedFile) {
    alert('Por favor, selecciona una imagen');
    return;
  }

  this.cargando = true;
  this.mensajeExito = null;

  try {
    const formData = this.formInstalacion.value;
    // Subir imagen primero
    const imagenUrl = await this.uploadImage(this.selectedFile);

    // Crear objeto de datos
    const instalacion: Instalacion = {
      titulo: formData.titulo,
      descripcion: formData.descripcion || '',
      imagenUrl: imagenUrl,
      timestamp: Date.now(),
      horarios: {}
    };

    // Procesar horarios
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    dias.forEach(dia => {
      const apertura = formData[`apertura_${dia}`];
      const cierre = formData[`cierre_${dia}`];
      if (apertura && cierre) {
        // Normalizar el día (quitar tildes)
        const diaNormalizado = dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        instalacion.horarios![diaNormalizado] = {
          apertura: apertura,
          cierre: cierre
        };
      }
    });

    // Guardar en Firestore
    const instalacionesRef = fsCollection(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones`);
    
    if (this.isEditing && this.currentInstalacionId) {
      await updateDoc(doc(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones/${this.currentInstalacionId}`), instalacion);
      this.mensajeExito = 'Instalación actualizada correctamente.';
    } else {
      await addDoc(instalacionesRef, instalacion);
      this.mensajeExito = 'Instalación creada correctamente.';
    }

    this.resetForm();
    setTimeout(() => this.mensajeExito = null, 3000);

  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la instalación: ' + error);
  } finally {
    this.cargando = false;
  }
}

async deleteInstalacion(id: string): Promise<void> {
  if (!confirm('¿Está seguro de que desea eliminar esta instalación?')) return;
  
  try {
    // Obtener la referencia del documento
    const instalacionRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones/${id}`);
    
    // Obtener los datos de la instalación
    const instalacionDoc = await getDoc(instalacionRef);
    const instalacion = instalacionDoc.data();

    if (instalacion && instalacion['imagenUrl']) {
      // Eliminar la imagen del storage primero
      await this.deleteImageFromStorage(instalacion['imagenUrl']);
    }

    // Eliminar el documento de Firestore
    await deleteDoc(instalacionRef);

  } catch (error) {
    console.error('Error al eliminar:', error);
    alert('Error al eliminar la instalación');
  }
}

// Cancelar edición
cancelEdit(): void {
  this.resetForm();
}

// Editar instalación
editInstalacion(instalacion: Instalacion): void {
  this.isEditing = true;
  this.currentInstalacionId = instalacion.id || null;
  this.currentImageUrl = instalacion['imagenUrl'] || null;

  // Rellenar el formulario con los datos existentes
  this.formInstalacion.patchValue({
    titulo: instalacion['titulo'],
    descripcion: instalacion['descripcion'] || '',
  });

  // Rellenar los horarios si existen
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  if (instalacion['horarios']) {
    dias.forEach(dia => {
      const diaNormalizado = dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const horario = instalacion['horarios']?.[diaNormalizado];
      if (horario) {
        this.formInstalacion.patchValue({
          [`apertura_${dia}`]: horario.apertura,
          [`cierre_${dia}`]: horario.cierre
        });
      }
    });
  }

  // Hacer scroll al formulario
  const formElement = document.querySelector('.card-form');
  formElement?.scrollIntoView({ behavior: 'smooth' });
}

// Toggle dropdown de usuario
toggleDropdown(): void {
  this.showDropdown = !this.showDropdown;
}

// Cerrar sesión
logout(): void {
  this.auth.signOut();
  this.router.navigate(['/login']);
}
}