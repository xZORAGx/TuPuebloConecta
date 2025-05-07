import { Routes } from '@angular/router';

// COMPONENTES PRINCIPALES
import { HomeComponent } from './pages/home.component';
import { LoginComponent } from './login/login.component';
import { UsuariosComponent } from './pages/ListadoUsuarios/usuarios.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // PANTALLA DE INCIDENCIAS CON PARÁMETRO :pueblo (Lazy Load)
  {
    path: 'incidencias/:pueblo',
    loadComponent: () => import('./pages/ListadoIncidencias/listado-incidencias.component')
      .then(m => m.ListadoIncidenciasComponent)
  },

  // PANTALLA DE INSTALACIONES (Listado + CRUD)
  {
    path: 'instalaciones',
    loadComponent: () => import('./pages/ListadoInstalaciones/listado-instalaciones.component')
      .then(m => m.ListadoInstalacionesComponent)
  },

  // PANTALLA DE USUARIOS CON PARÁMETRO :pueblo
  { path: 'usuarios/:pueblo', component: UsuariosComponent },

  // PANTALLA DE GESTIÓN DEL PUEBLO (Lazy Load)
  {
    path: 'gestion',
    loadComponent: () => import('./pages/gestion-pueblo/gestion-pueblo.component')
      .then(m => m.GestionPuebloComponent)
  },

  // CREAR NOTICIA
  {
    path: 'crear-noticia',
    loadComponent: () => import('./pages/crear-noticia/crear-noticia.component')
      .then(m => m.CrearNoticiaComponent)
  },

  // DETALLE DE NOTICIA
  {
    path: 'detalle-noticia/:id',
    loadComponent: () => import('./pages/crear-noticia/detalle-noticia.component')
      .then(m => m.DetalleNoticiaComponent)
  },

  // REDIRECCIÓN PARA RUTAS NO ENCONTRADAS
  { path: '**', redirectTo: '' }
];
