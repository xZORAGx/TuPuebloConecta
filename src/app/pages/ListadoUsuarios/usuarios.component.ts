import { Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';

// IMPORTS DE ANGULAR MATERIAL
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { EditarUsuarioDialog } from './editar-usuario-dialog.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,

  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  puebloGestionado: string = '';
  displayedColumns: string[] = ['usuario', 'correo', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.puebloGestionado = this.route.snapshot.paramMap.get('pueblo') || '';
    if (!this.puebloGestionado) return;
    this.obtenerUsuarios();
  }

  async obtenerUsuarios(): Promise<void> {
    try {
      const usuariosRef = collection(this.firestore, 'Usuarios');
      const q = query(usuariosRef, where('pueblo', '==', this.puebloGestionado));
      const querySnapshot = await getDocs(q);

      const usuarios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.dataSource.data = usuarios;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      console.log('Usuarios cargados:', usuarios);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  editarUsuario(usuario: any): void {
    const dialogRef = this.dialog.open(EditarUsuarioDialog, {
      width: '400px',
      data: usuario
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const userDoc = doc(this.firestore, 'Usuarios', usuario.id);
        updateDoc(userDoc, {
          Usuario: result.Usuario,
          Correo: result.Correo,
          Tipo: result.Tipo
        }).then(() => {
          console.log('Usuario actualizado');
          this.obtenerUsuarios();
        }).catch(err => console.error('Error actualizando usuario:', err));
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (confirm(`¿Seguro que quieres eliminar al usuario ${usuario.Usuario}?`)) {
      const userDoc = doc(this.firestore, 'Usuarios', usuario.id);
      deleteDoc(userDoc).then(() => {
        console.log('Usuario eliminado');
        this.obtenerUsuarios();
      }).catch(err => console.error('Error eliminando usuario:', err));
    }
  }

}
