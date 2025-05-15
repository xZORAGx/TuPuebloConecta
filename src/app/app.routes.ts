// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent }   from './pages/home.component';
import { LoginComponent }  from './login/login.component';
import { UsuariosComponent } from './pages/ListadoUsuarios/usuarios.component';

export const routes: Routes = [
  { path: '',                        component: HomeComponent },
  { path: 'login',                   component: LoginComponent },

  // INCIDENCIAS
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

  // USUARIOS
  { path: 'usuarios/:pueblo', component: UsuariosComponent },

  // FIESTAS
  {
    path: 'fiestas',
    loadComponent: () =>
      import('./pages/Fiestas/fiestas.component')
        .then(m => m.FiestasComponent)
  },

  // GESTIÓN PUEBLO
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

  // EMPLEO
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

  // DEPORTES
  {
    path: 'deportes',
    loadComponent: () =>
      import('./pages/deportes/deportes/deportes.component')
        .then(m => m.DeportesComponent)
  },
    {
    path: 'telefonos',
    loadComponent: () =>
      import('./pages/Telefonos/telefonos-form.component')
        .then(m => m.TelefonosFormComponent)
  },

  // CUALQUIER OTRA RUTA
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
