import { Routes } from '@angular/router';

// COMPONENTES PRINCIPALES
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login/login.component';
import { UsuariosComponent } from './pages/ListadoUsuarios/usuarios.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // PANTALLA DE USUARIOS CON PARAMETRO :pueblo
  { path: 'usuarios/:pueblo', component: UsuariosComponent },

  // GESTIÓN DEL PUEBLO CON LAZY LOAD DEL COMPONENTE
  {
    path: 'gestion',
    loadComponent: () => import('./pages/gestion-pueblo/gestion-pueblo.component')
      .then(m => m.GestionPuebloComponent)
  },

  // REDIRECCIÓN PARA RUTAS NO ENCONTRADAS
  { path: '**', redirectTo: '' }
];
