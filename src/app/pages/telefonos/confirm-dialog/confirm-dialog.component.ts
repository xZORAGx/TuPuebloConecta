import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">Confirmar eliminación</h2>
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.mensaje }}</p>
      </div>
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          Cancelar
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-btn">
          Eliminar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 8px;
    }
    
    .dialog-title {
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .dialog-content {
      margin-bottom: 20px;
    }
    
    .dialog-content p {
      color: #555;
      font-size: 16px;
      margin: 0;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .cancel-btn {
      color: #6c757d;
    }
    
    .confirm-btn {
      background: #e74c3c;
      color: white;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mensaje: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
