import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'gestion',
    loadComponent: () => import('./pages/gestion-pueblo/gestion-pueblo.component')
      .then(m => m.GestionPuebloComponent)
  },
  { path: '**', redirectTo: '' }
];

