import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-descripcion',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Descripción completa</h2>
    <mat-dialog-content>
      <p>{{ data.descripcion }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./dialog-descripcion.component.css']
})
export class DialogDescripcionComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { descripcion: string }) {}
}
