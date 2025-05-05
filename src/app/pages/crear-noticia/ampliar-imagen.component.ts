import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-ampliar-imagen',
  standalone: true,
  template: `<img [src]="data.imagenUrl" alt="Imagen ampliada" />`,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      padding: 0;
    }

    img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 12px;
    }
  `]
})
export class AmpliarImagenComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { imagenUrl: string }) {}
}
