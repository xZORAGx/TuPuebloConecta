import { Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

// Common Angular Modules
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importa tu diálogo ya creado
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
    MatDialogModule,
  
  ],
  templateUrl: './listado-incidencias.component.html',
  styleUrls: ['./listado-incidencias.component.css']
})
export class ListadoIncidenciasComponent implements OnInit {

  puebloGestionado: string = '';
  tiposIncidencias: string[] = [
    'Incidencia en el pueblo',
    'Recomendacion de la app',
    'Mascota perdida',
    'Objeto perdido'
  ];

  displayedColumns: string[] = ['titulo', 'descripcion', 'correo', 'tipo', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private firestore: Firestore, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.obtenerIncidencias();
  }

  async obtenerIncidencias(): Promise<void> {
    const incidenciasRef = collection(this.firestore, 'Incidencias');
    const querySnapshot = await getDocs(incidenciasRef);
    const incidencias = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    this.dataSource.data = incidencias;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  aplicarFiltro(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  aplicarFiltroTipo(event: any): void {
    const tipoSeleccionado = event.value;
    this.dataSource.filter = tipoSeleccionado.trim().toLowerCase();
  }

  eliminarIncidencia(incidencia: any): void {
    if (confirm(`¿Seguro que quieres eliminar la incidencia "${incidencia.Titulo}"?`)) {
      const incidenciaDoc = doc(this.firestore, 'Incidencias', incidencia.id);
      deleteDoc(incidenciaDoc).then(() => {
        this.obtenerIncidencias();
      });
    }
  }

  verDescripcionCompleta(descripcion: string): void {
    this.dialog.open(DialogDescripcionComponent, {
      data: { descripcion },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }
}
