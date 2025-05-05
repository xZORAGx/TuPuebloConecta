import { Routes } from '@angular/router';

// COMPONENTES PRINCIPALES
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login/login.component';
import { UsuariosComponent } from './pages/ListadoUsuarios/usuarios.component';
// Elimina la importación directa del componente de incidencias
// import { ListadoIncidenciasComponent } from './pages/ListadoIncidencias/listado-incidencias.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // PANTALLA DE INCIDENCIAS CON PARAMETRO :pueblo (Lazy Load)
  {
    path: 'incidencias/:pueblo',
    loadComponent: () => import('./pages/ListadoIncidencias/listado-incidencias.component')
      .then(m => m.ListadoIncidenciasComponent)
  },

  // PANTALLA DE USUARIOS CON PARAMETRO :pueblo
  { path: 'usuarios/:pueblo', component: UsuariosComponent },

  // GESTIÓN DEL PUEBLO CON LAZY LOAD DEL COMPONENTE
  {
    path: 'gestion',
    loadComponent: () => import('./pages/gestion-pueblo/gestion-pueblo.component')
      .then(m => m.GestionPuebloComponent)
  },

  {
    path: 'crear-noticia',
    loadComponent: () => import('./pages/crear-noticia/crear-noticia.component')
      .then(m => m.CrearNoticiaComponent)
  },
  

  // REDIRECCIÓN PARA RUTAS NO ENCONTRADAS
  { path: '**', redirectTo: '' }
];
