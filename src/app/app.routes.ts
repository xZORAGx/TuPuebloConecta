// src/app/app-routing.module.ts

import { Routes } from '@angular/router';

// COMPONENTES PRINCIPALES
import { HomeComponent }   from './pages/home.component';
import { LoginComponent }  from './login/login.component';
import { UsuariosComponent } from './pages/ListadoUsuarios/usuarios.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // INCIDENCIAS por pueblo
  {
    path: 'incidencias/:pueblo',
    loadComponent: () =>
      import('./pages/ListadoIncidencias/listado-incidencias.component')
        .then(m => m.ListadoIncidenciasComponent)
  },

  // INSTALACIONES
  {
    path: 'instalaciones',
    loadComponent: () =>
      import('./pages/ListadoInstalaciones/listado-instalaciones.component')
        .then(m => m.ListadoInstalacionesComponent)
  },

  // USUARIOS por pueblo
  { path: 'usuarios/:pueblo', component: UsuariosComponent },

  // FIESTAS
  {
    path: 'fiestas',
    loadComponent: () =>
      import('./pages/Fiestas/fiestas.component')
        .then(m => m.FiestasComponent)
  },

  // GESTIÓN DEL PUEBLO
  {
    path: 'gestion',
    loadComponent: () =>
      import('./pages/gestion-pueblo/gestion-pueblo.component')
        .then(m => m.GestionPuebloComponent)
  },

  // NOTICIAS
  {
    path: 'crear-noticia',
    loadComponent: () =>
      import('./pages/crear-noticia/crear-noticia.component')
        .then(m => m.CrearNoticiaComponent)
  },
  {
    path: 'crear-noticia/:id',
    loadComponent: () =>
      import('./pages/crear-noticia/crear-noticia.component')
        .then(m => m.CrearNoticiaComponent)
  },
  {
    path: 'detalle-noticia/:id',
    loadComponent: () =>
      import('./pages/crear-noticia/detalle-noticia.component')
        .then(m => m.DetalleNoticiaComponent)
  },

  // EMPLEO — listado/formulario y detalle
  {
    path: 'empleo',
    loadComponent: () =>
      import('./pages/empleo/crear-empleo/crear-empleo.component')
        .then(m => m.CrearEmpleoComponent)
  },
  {
    path: 'empleo/:id',
    loadComponent: () =>
      import('./pages/empleo/detalle-empleo/detalle-empleo.component')
        .then(m => m.DetalleEmpleoComponent)
  },

  // Wildcard: rutas no encontradas
  { path: '**', redirectTo: '' }
];
