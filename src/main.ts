import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // ✅ Aquí ya tienes los providers
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
