import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-ampliar-imagen',
  standalone: true,
  imports: [ CommonModule, MatDialogModule ],
  templateUrl: './ampliar-imagen.component.html',
  styleUrls: ['./ampliar-imagen.component.css']
})
export class AmpliarImagenComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { imagenUrl: string }) {}
}
