import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http'; // Import provideHttpClient and withFetch

// Componentes de tus páginas
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login/login.component';
// import { GestionComponent } from './pages/gestion/gestion.component'; // si existe

// Firebase
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Animaciones para Angular Material
import { provideAnimations } from '@angular/platform-browser/animations';

// Proveedores para datepicker
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MY_DATE_FORMATS } from './shared/providers/date-providers';

// Configuración de Firebase
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },

      { path: '**', redirectTo: '' } // ruta por defecto
    ]),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),

    // Angular Material necesita animations
    provideAnimations(),    // Proveedores para DatePicker
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },

    // Provide HttpClient for MatIconRegistry and other HTTP services
    provideHttpClient(withFetch()) // Add withFetch() for modern fetch-based HttpClient
  ]
};
