// listado-incidencias.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from '@angular/fire/firestore';
import { MatTableDataSource }        from '@angular/material/table';
import { MatPaginator }              from '@angular/material/paginator';
import { MatSort }                   from '@angular/material/sort';
import { MatDialog }                 from '@angular/material/dialog';
import { CommonModule }              from '@angular/common';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatSelectModule }           from '@angular/material/select';
import { MatOptionModule }           from '@angular/material/core';
import { MatTableModule }            from '@angular/material/table';
import { MatPaginatorModule }        from '@angular/material/paginator';
import { MatSortModule }             from '@angular/material/sort';
import { MatButtonModule }           from '@angular/material/button';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatDialogModule }           from '@angular/material/dialog';
import { DialogDescripcionComponent } from '../../shared/dialog-descripcion/dialog-descripcion.component';

@Component({
  selector: 'app-listado-incidencias',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './listado-incidencias.component.html',
  styleUrls: ['./listado-incidencias.component.css']
})
export class ListadoIncidenciasComponent implements OnInit {
  puebloGestionado = 'Figueruelas';
  tiposIncidencias = [
    'Incidencia en el pueblo',
    'Recomendacion de la app',
    'Mascota perdida',
    'Objeto perdido'
  ];

  displayedColumns = [
    'titulo',
    'descripcion',
    'correo',
    'tipo',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  constructor(
    private firestore: Firestore,
    private dialog:    MatDialog
  ) {}

  ngOnInit(): void {
    this.obtenerIncidencias();
  }

  /** Reemplaza 'incidencias%2F' (minúscula) por 'Incidencias%2F' */
  normalizeUrl(url: string): string {
    return url.replace(
      /\/o\/incidencias%2[fF]/i,
      '/o/Incidencias%2F'
    );
  }

  async obtenerIncidencias(): Promise<void> {
    const ref = collection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Incidencias`
    );
    const snap = await getDocs(ref);
    const list = snap.docs.map(d => ({
      id:   d.id,
      ...d.data()
    }));
    this.dataSource.data      = list;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  aplicarFiltroTipo(event: any): void {
    this.dataSource.filter = event.value.trim().toLowerCase();
  }

  eliminarIncidencia(incidencia: any): void {
    if (
      confirm(
        `¿Seguro que quieres eliminar la incidencia "${incidencia.Titulo}"?`
      )
    ) {
      const incidenciaDoc = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Incidencias`,
        incidencia.id
      );
      deleteDoc(incidenciaDoc).then(() =>
        this.obtenerIncidencias()
      );
    }
  }

  verDescripcionCompleta(descripcion: string): void {
    this.dialog.open(DialogDescripcionComponent, {
      data:       { descripcion },
      width:      '400px',
      panelClass: 'custom-dialog-container'
    });
  }
}
