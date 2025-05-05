import { Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, collection, getDocs, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

// Angular Material
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
    MatDialogModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  puebloGestionado: string = 'Figueruelas'; // 🔥 mismo estilo que ListadoIncidencias
  displayedColumns: string[] = ['usuario', 'correo', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private firestore: Firestore, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
  }

  async obtenerUsuarios(): Promise<void> {
    const usuariosRef = collection(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`);
    const querySnapshot = await getDocs(usuariosRef);
    const usuarios = querySnapshot.docs.map(doc => ({
      id: doc.id,
      usuario: doc.data()['Usuario'],
      correo: doc.data()['Correo'],
      tipo: doc.data()['Tipo']
    }));
    this.dataSource.data = usuarios;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  editarUsuario(usuario: any): void {
    const dialogRef = this.dialog.open(EditarUsuarioDialog, {
      width: '400px',
      data: {
        Usuario: usuario.usuario,
        Correo: usuario.correo,
        Tipo: usuario.tipo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const userDoc = doc(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`, usuario.id);
        updateDoc(userDoc, {
          Usuario: result.Usuario,
          Correo: result.Correo,
          Tipo: result.Tipo
        }).then(() => {
          this.obtenerUsuarios();
        });
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (confirm(`¿Seguro que quieres eliminar al usuario "${usuario.usuario}"?`)) {
      const userDoc = doc(this.firestore, `pueblos/${this.puebloGestionado}/Usuarios`, usuario.id);
      deleteDoc(userDoc).then(() => {
        this.obtenerUsuarios();
      });
    }
  }
}
