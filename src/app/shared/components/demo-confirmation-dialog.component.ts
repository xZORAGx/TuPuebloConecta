import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment'; // Added import

@Component({
  selector: 'app-demo-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-container">
      <div class="success-icon">
        <mat-icon>check_circle</mat-icon>
      </div>
      
      <h2 mat-dialog-title>¡Solicitud Enviada!</h2>
      
      <mat-dialog-content>
        <p class="confirmation-message">{{data.message}}</p>
        
        <div class="demo-details">
          <h3>Detalles de su reunión:</h3>
          <p><strong>Fecha:</strong> {{formatDate(data.demoData.fecha)}}</p>
          <p><strong>Hora:</strong> {{data.demoData.hora}}</p>
          <p><strong>Contacto:</strong> {{data.demoData.nombre}}</p>
          <p><strong>Email:</strong> {{data.demoData.email}}</p>
        </div>
        
        <p class="note">Se ha enviado un correo de confirmación a la dirección proporcionada.</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="center">
        <button mat-raised-button color="primary" (click)="closeDialog()">
          Aceptar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-container {
      text-align: center;
      padding: 1rem;
      max-width: 400px;
    }
    
    .success-icon {
      margin: 1rem auto;
    }
    
    .success-icon mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      color: #4CAF50;
    }
    
    .confirmation-message {
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
    }
    
    .demo-details {
      text-align: left;
      background: rgba(0, 0, 0, 0.03);
      padding: 1rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }
    
    .demo-details h3 {
      margin-top: 0;
      color: #3f51b5;
      font-weight: 500;
    }
    
    .note {
      font-style: italic;
      color: #666;
      font-size: 0.9rem;
    }
  `]
})
export class DemoConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DemoConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
      demoData: {
        nombre: string;
        email: string;
        fecha: Date;
        hora: string;
      }
    }
  ) {}

  formatDate(dateInput: any): string { // Changed parameter type from Date to any
    let jsDate: Date;

    if (moment.isMoment(dateInput)) {
      jsDate = (dateInput as moment.Moment).toDate();
    } else if (dateInput instanceof Date) {
      jsDate = dateInput;
    } else if (typeof dateInput === 'string') {
      // Try parsing with moment, which is more flexible for various formats
      const parsedMoment = moment(dateInput, [
        moment.ISO_8601, 
        'L', 'LL', 'LLL', 'LLLL', 
        'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
      ], 'es', true); // Use 'es' locale and strict parsing

      if (parsedMoment.isValid()) {
        jsDate = parsedMoment.toDate();
      } else {
        // Fallback for other string formats if moment parsing fails
        const d = new Date(dateInput);
        if (d instanceof Date && !isNaN(d.getTime())) {
          jsDate = d;
        } else {
          console.error('Invalid date string received in confirmation dialog:', dateInput);
          return 'Fecha inválida';
        }
      }
    } else if (typeof dateInput === 'number') { // Handle numeric timestamps
      jsDate = new Date(dateInput);
    } else {
      console.error('Unexpected date type in confirmation dialog:', dateInput);
      return 'Fecha no reconocida';
    }

    // Final check to ensure we have a valid Date object
    if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) {
      console.error('Could not convert to a valid Date object. Original input:', dateInput, 'Attempted conversion:', jsDate);
      return 'Error al procesar fecha';
    }

    return jsDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
