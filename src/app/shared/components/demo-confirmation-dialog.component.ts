import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
          <h3>Detalles de su demostración:</h3>
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

  formatDate(date: Date): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('es-ES', {
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
