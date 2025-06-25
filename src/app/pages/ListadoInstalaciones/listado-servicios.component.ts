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
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  DocumentData
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { v4 as uuidv4 } from 'uuid';
import { Unsubscribe } from '@firebase/util';
import { Servicio, Horario, LineaBus } from '../../interfaces/servicio.interface';

interface UserWeb {
  correo: string;
  pueblo_gestionado: string;
}

@Component({
  selector: 'app-listado-servicios',
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
    MatProgressSpinnerModule,
    MatRadioModule
  ],  templateUrl: './listado-servicios.component.html',
  styleUrls: ['./listado-servicios.component.css']
})
export class ListadoServiciosComponent implements OnInit, AfterViewInit, OnDestroy {
  // Formularios
  formServicio: FormGroup;
  formLineaBus: FormGroup;

  // Estado de la interfaz
  cargando = false;
  mensajeExito: string | null = null;
  showDropdown = false;
  isEditing = false;
  mostrarFormularioLineaBus = false;

  // Datos
  servicios: Servicio[] = [];
  lineasBus: LineaBus[] = [];
  userData: UserWeb | null = null;
  puebloGestionado = 'Figueruelas';
  basePath = '';
  
  // Gestión de archivos
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  imagePreview: string | null = null;
  currentFileUrl: string | null = null;
  currentServicioId: string | null = null;

  // Observables
  private userUnsub?: Unsubscribe;
  private unsubscribeServicios?: Unsubscribe;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    public auth: Auth,
    public router: Router
  ) {
    this.formServicio = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
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
      cierre_domingo: ['']
    });

    this.formLineaBus = this.fb.group({
      nombreLinea: ['', Validators.required],
      direccion: ['', Validators.required],
      horarios: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.basePath = `pueblos/${this.puebloGestionado}`;
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userDoc = doc(this.firestore, 'usuarios_web', uid);
      this.userUnsub = onSnapshot(userDoc, snap => {
        if (snap.exists()) {
          this.userData = snap.data() as UserWeb;
          if (this.userData?.pueblo_gestionado) {
            this.puebloGestionado = this.userData.pueblo_gestionado;
            this.basePath = `pueblos/${this.puebloGestionado}`;
            this.loadServicios();
            this.loadLineasBus();
          }
        }
      });
    } else {
      this.loadServicios();
      this.loadLineasBus();
    }
  }

  ngAfterViewInit(): void {
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
    if (this.unsubscribeServicios) {
      this.unsubscribeServicios();
    }
  }

  // Cargar servicios desde Firestore
  loadServicios(): void {
    try {
      console.log('Cargando servicios para pueblo:', this.puebloGestionado);
      const instalacionesRef = collection(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones`);
      const q = query(instalacionesRef, orderBy('timestamp', 'desc'));
      
      // Cancelar suscripción anterior si existe
      if (this.unsubscribeServicios) {
        this.unsubscribeServicios();
      }

      this.unsubscribeServicios = onSnapshot(q, snapshot => {
        this.servicios = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Servicio cargado:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data
          } as Servicio;
        });
        console.log('Total servicios cargados:', this.servicios.length);
      }, error => {
        console.error('Error en snapshot de servicios:', error);
      });
    } catch (error) {
      console.error('Error en loadServicios:', error);
    }
  }

  loadLineasBus(): void {
    const lineasRef = collection(this.firestore, `${this.basePath}/Autobuses`);
    const q = query(lineasRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, snapshot => {
      this.lineasBus = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LineaBus[];
    }, error => {
      console.error('Error cargando líneas de autobús:', error);
    });
  }

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
            0.75
          );
        };
        
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
    });
  }

  private resetForm(): void {
    if (this.mostrarFormularioLineaBus) {
      this.formLineaBus.reset();
    } else {
      this.formServicio.reset();
      this.selectedFile = null;
      this.selectedFileName = null;
      this.imagePreview = null;
      this.currentFileUrl = null;
      this.currentServicioId = null;
      this.isEditing = false;
    }
  }

  private async subirArchivoYGuardar(file: File): Promise<string> {
    const fileName = `${uuidv4()}.${this.getFileExtension(file)}`;
    const storageRef = ref(this.storage, `instalaciones/${fileName}`);

    try {
      if (file.type.startsWith('image/')) {
        const compressedImage = await this.compressImage(file);
        await uploadBytes(storageRef, compressedImage);
      } else {
        // No subimos PDFs en esta versión para mantener compatibilidad con Android
        throw new Error('Solo se permiten imágenes');
      }

      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  }

  getFileExtension(file: File): string {
    if (file.type === 'image/jpeg') return 'jpg';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'application/pdf') return 'pdf';
    return file.name.split('.').pop() || '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.isValidFileType(file)) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.imagePreview = null; // No preview para PDFs
      }
    } else {
      alert('Por favor, selecciona una imagen (JPG/PNG) o un PDF');
    }
  }

  private isValidFileType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    return validTypes.includes(file.type);
  }
  public normalizeDay(dia: string): string {
    return dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async guardarServicio(): Promise<void> {
    if (!this.formServicio.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargando = true;

    try {
      const formData = this.formServicio.value;
      let imagenUrl: string | undefined = undefined;

      if (this.selectedFile) {
        imagenUrl = await this.subirArchivoYGuardar(this.selectedFile);
      }

      const servicio: Servicio = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || '',
        imagenUrl,
        timestamp: Date.now(),
        horarios: {}
      };

      // Procesar horarios usando los nombres con acentos
      const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      dias.forEach(dia => {
        const apertura = formData[`apertura_${dia}`];
        const cierre = formData[`cierre_${dia}`];
        if (apertura && cierre) {
          const diaNormalizado = this.normalizeDay(dia);
          servicio.horarios![diaNormalizado] = { apertura, cierre };
        }
      });

      if (this.isEditing && this.currentServicioId) {
        await updateDoc(doc(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones/${this.currentServicioId}`), servicio as DocumentData);
        this.mensajeExito = 'Servicio actualizado correctamente.';
      } else {
        await addDoc(collection(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones`), servicio as DocumentData);
        this.mensajeExito = 'Servicio creado correctamente.';
      }

      this.resetForm();
      setTimeout(() => this.mensajeExito = null, 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el servicio: ' + error);
    } finally {
      this.cargando = false;
    }
  }

  editServicio(servicio: Servicio): void {
    this.isEditing = true;
    this.currentServicioId = servicio.id ?? null;
    this.currentFileUrl = servicio.imagenUrl ?? null;

    this.formServicio.patchValue({
      titulo: servicio.titulo,
      descripcion: servicio.descripcion || '',
    });

    if (servicio.horarios) {
      const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      dias.forEach(dia => {
        const diaNormalizado = this.normalizeDay(dia);
        const horario = servicio.horarios?.[diaNormalizado];
        if (horario) {
          this.formServicio.patchValue({
            [`apertura_${dia}`]: horario.apertura,
            [`cierre_${dia}`]: horario.cierre
          });
        }
      });
    }

    const formElement = document.querySelector('.card-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.auth.signOut();
    this.router.navigate(['/login']);
  }
  toggleFormularioLineaBus(): void {
    this.mostrarFormularioLineaBus = !this.mostrarFormularioLineaBus;
    if (this.mostrarFormularioLineaBus) {
      this.formLineaBus.reset();
      this.loadLineasBus(); // Cargar líneas de bus al cambiar a esa vista
    } else {
      this.loadServicios(); // Recargar servicios cuando volvemos a esa vista
      this.formServicio.reset();
    }
  }

  async deleteServicio(id: string): Promise<void> {
    if (!confirm('¿Está seguro de que desea eliminar este servicio?')) return;
    
    try {
      const servicioRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Instalaciones/${id}`);
      const servicioDoc = await getDoc(servicioRef);
      const servicio = servicioDoc.data() as Servicio;

      if (servicio?.imagenUrl) {
        // Eliminar la imagen del storage
        const fileRef = ref(this.storage, servicio.imagenUrl);
        await deleteObject(fileRef);
      }

      // Eliminar el documento de Firestore
      await deleteDoc(servicioRef);

    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el servicio');
    }
  }

  async deleteLineaBus(id: string): Promise<void> {
    if (!confirm('¿Está seguro de que desea eliminar esta línea de autobús?')) return;
    
    try {
      await deleteDoc(doc(this.firestore, `${this.basePath}/Autobuses/${id}`));
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la línea de autobús');
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.imagePreview = null;
  }

  cancelEdit(): void {
    this.resetForm();
    this.isEditing = false;
  }

  async guardarLineaBus(): Promise<void> {
    if (!this.formLineaBus.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.cargando = true;

    try {
      const formData = this.formLineaBus.value;
      
      const lineaBus: LineaBus = {
        nombreLinea: formData.nombreLinea,
        direccion: formData.direccion,
        horarios: formData.horarios,
        timestamp: Date.now()
      };

      await addDoc(collection(this.firestore, `pueblos/${this.puebloGestionado}/Autobuses`), lineaBus as DocumentData);
      this.mensajeExito = 'Línea de autobús guardada correctamente.';
      this.formLineaBus.reset();
      setTimeout(() => this.mensajeExito = null, 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la línea de autobús: ' + error);
    } finally {
      this.cargando = false;
    }
  }
}