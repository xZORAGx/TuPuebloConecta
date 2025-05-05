import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

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
    provideAnimations()
  ]
};
