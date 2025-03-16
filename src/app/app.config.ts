import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './pages/home.component';


// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Animations (Angular Material lo requiere)
import { provideAnimations } from '@angular/platform-browser/animations';

// Tu configuración de Firebase
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      { path: '', component: HomeComponent },
      // { path: 'login', component: LoginComponent }, ➡️ Después lo añadimos
      // { path: 'dashboard', component: DashboardComponent }, ➡️ Después también
    ]),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // Angular Material necesita animations
    provideAnimations()
  ]
};

