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

  // Subir imagen a Firebase Storage
  private async uploadImage(file: File): Promise<string> {
    try {
      // Usar UUID para generar un nombre de archivo único
      const ruta = `pueblos/${this.puebloGestionado}/Instalaciones/${uuidv4()}`;
      const storageRef = ref(this.storage, ruta);
      
      console.log('Subiendo imagen a:', ruta);
      
      // Subir archivo a Firebase Storage
      await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Imagen subida correctamente, URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    }
  }
  
  // Eliminar imagen de Firebase Storage
  private async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl) return;
      
      // Extraer la ruta del storage de la URL
      const start = imageUrl.indexOf('/o/') + 3;
      const end = imageUrl.indexOf('?');
      
      if (start > 0 && end > start) {
        const path = decodeURIComponent(imageUrl.substring(start, end));
        const storageRef = ref(this.storage, path);
        
        console.log('Eliminando imagen de:', path);
        await deleteObject(storageRef);
        console.log('Imagen eliminada correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      throw error;
    }
  }

  // Procesar el formulario para crear o actualizar una instalación
  async publicarInstalacion(): Promise<void> {
    if (this.formInstalacion.invalid) {
      console.log('Formulario inválido');
      return;
    }
    this.cargando = true;
    this.mensajeExito = null;
    try {
      const formData = this.formInstalacion.value;
      // Construir horarios solo con días que tengan datos y claves sin tildes
      const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      const horarios: { [key: string]: Horario } = {};
      dias.forEach(dia => {
        const horario = this.getHorarioDia(dia, formData);
        if (horario) {
          // Quitar tildes para la clave
          const key = dia.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // CORREGIR: debe ser /[\u0300-\u036f]/g
          horarios[key] = horario;
        }
      });
      const instalacion: Instalacion = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || '',
        timestamp: Date.now(),
        horarios: horarios
      };
      // Gestionar la imagen si hay una nueva
      if (this.selectedFile) {
        // Si estamos editando y hay una imagen anterior, eliminarla
        if (this.isEditing && this.currentImageUrl) {
          await this.deleteImageFromStorage(this.currentImageUrl);
        }
        
        // Subir la nueva imagen
        instalacion.imagenUrl = await this.uploadImage(this.selectedFile);
      } else if (this.isEditing && this.currentImageUrl) {
        // Mantener la URL de la imagen existente si estamos editando
        instalacion.imagenUrl = this.currentImageUrl;
      }
      
      // Guardar en Firestore
      if (this.isEditing && this.currentInstalacionId) {
        // Actualizar instalación existente
        const docRef = doc(
          this.firestore,
          `${this.basePath}/Instalaciones/${this.currentInstalacionId}`
        );
        
        await updateDoc(docRef, instalacion);
        this.mensajeExito = 'Instalación actualizada correctamente.';
      } else {
        // Crear nueva instalación
        const instalacionesRef = fsCollection(
          this.firestore,
          `${this.basePath}/Instalaciones`
        );
        
        await addDoc(instalacionesRef, instalacion);
        this.mensajeExito = 'Instalación creada correctamente.';
      }
      
      // Resetear formulario y estado
      this.resetForm();
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito = null;
      }, 3000);
    } catch (error) {
      console.error('Error al guardar instalación:', error);
      alert('❌ Error al guardar la instalación');
    } finally {
      this.cargando = false;
    }
  }

  // Obtener horario formateado para un día específico
  private getHorarioDia(dia: string, formData: any): Horario | undefined {
    const apertura = formData[`apertura_${dia}`];
    const cierre = formData[`cierre_${dia}`];
    
    if (apertura || cierre) {
      return {
        apertura: apertura || '',
        cierre: cierre || ''
      };
    }
    
    return undefined;
  }

  // Resetear formulario y estados
  private resetForm(): void {
    this.formInstalacion.reset();
    this.isEditing = false;
    this.currentInstalacionId = null;
    this.currentImageUrl = null;
    this.selectedFile = null;
    this.selectedFileName = null;
    this.imagePreview = null;
  }
  // Cargar datos de una instalación para editarla
  editInstalacion(instalacion: Instalacion): void {
    this.isEditing = true;
    this.currentInstalacionId = instalacion.id || null;
    this.currentImageUrl = instalacion.imagenUrl || null;
    this.imagePreview = instalacion.imagenUrl || null;
    
    // Actualizar valores del formulario
    this.formInstalacion.patchValue({
      titulo: instalacion.titulo,
      descripcion: instalacion.descripcion || ''
    });
    
    // Cargar horarios
    const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    dias.forEach(dia => {
      const horario = instalacion.horarios?.[dia as keyof typeof instalacion.horarios];
      if (horario) {
        this.formInstalacion.patchValue({
          [`apertura_${dia}`]: horario.apertura || '',
          [`cierre_${dia}`]: horario.cierre || ''
        });
      } else {
        this.formInstalacion.patchValue({
          [`apertura_${dia}`]: '',
          [`cierre_${dia}`]: ''
        });
      }
    });
  }

  // Cancelar la edición
  cancelEdit(): void {
    this.resetForm();
  }

  // Eliminar una instalación
  async deleteInstalacion(id: string): Promise<void> {
    if (!confirm('¿Está seguro de que desea eliminar esta instalación?')) {
      return;
    }
    
    try {
      const docRef = doc(this.firestore, `${this.basePath}/Instalaciones/${id}`);
      
      // Obtener datos de la instalación para eliminar la imagen
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data['imagenUrl']) {
          await this.deleteImageFromStorage(data['imagenUrl']);
        }
      }
      
      // Eliminar documento
      await deleteDoc(docRef);
      alert('🗑️ Instalación eliminada');
    } catch (error) {
      console.error('Error al eliminar instalación:', error);
      alert('❌ Error al eliminar la instalación');
    }
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