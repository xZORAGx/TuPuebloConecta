// main.ts
import { enableProdMode }       from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter }        from '@angular/router';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth,    getAuth }           from '@angular/fire/auth';
import { provideFirestore, getFirestore }    from '@angular/fire/firestore';
import { provideStorage,   getStorage }      from '@angular/fire/storage';

import { AppComponent } from './app/app.component';
import { routes }       from './app/app.routes';
import { environment }  from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),

    // Inicialización de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(()    => getAuth()),
    provideFirestore(() => getFirestore()),

    // <-- Añade esto para Storage
    provideStorage(() => getStorage()),
  ]
})
.catch(err => console.error(err));
