import { Component, Inject, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MY_DATE_FORMATS } from '../providers/date-providers';
import moment from 'moment';
import 'moment/locale/es';

// Proporciona todos los proveedores necesarios para el datepicker
const DATEPICKER_PROVIDERS = [
  { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
  { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
  { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
];

@Component({
  selector: 'app-demo-request-dialog',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [
    ...DATEPICKER_PROVIDERS
  ],
  template: `
    <h2 mat-dialog-title>Solicitar Demostración</h2>
    <mat-dialog-content>
      <form [formGroup]="demoForm" class="demo-form">
        <!-- Datos personales -->
        <div class="form-section">
          <h3>Datos de contacto</h3>
          
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej. María García">
            <mat-error *ngIf="demoForm.controls['nombre'].hasError('required')">
              El nombre es obligatorio
            </mat-error>
          </mat-form-field>
          
          <div class="form-row">
            <mat-form-field appearance="fill">
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="email" placeholder="Ej. maria@ayuntamiento.es">
              <mat-error *ngIf="demoForm.controls['email'].hasError('required')">
                El correo es obligatorio
              </mat-error>
              <mat-error *ngIf="demoForm.controls['email'].hasError('email')">
                Ingrese un correo válido
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" placeholder="Ej. 612345678">
              <mat-error *ngIf="demoForm.controls['telefono'].hasError('pattern')">
                Ingrese un número válido
              </mat-error>
            </mat-form-field>
          </div>
          
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Municipio</mat-label>
            <input matInput formControlName="municipio" placeholder="Ej. Villanueva del Río">
            <mat-error *ngIf="demoForm.controls['municipio'].hasError('required')">
              El municipio es obligatorio
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Cargo</mat-label>
            <input matInput formControlName="cargo" placeholder="Ej. Concejal de Comunicación">
            <mat-hint>Opcional</mat-hint>
          </mat-form-field>
        </div>
        
        <!-- Programación de la demostración -->
        <div class="form-section">
          <h3>Programar videollamada</h3>
            <mat-form-field appearance="fill">
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha" readonly (click)="picker.open()">
            <mat-hint>Haga clic para abrir el calendario</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="demoForm.controls['fecha'].hasError('required')">
              La fecha es obligatoria
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="fill">
            <mat-label>Hora</mat-label>
            <mat-select formControlName="hora">
              <mat-option *ngFor="let hora of horasDisponibles" [value]="hora">
                {{hora}}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="demoForm.controls['hora'].hasError('required')">
              La hora es obligatoria
            </mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Comentarios adicionales</mat-label>
            <textarea matInput formControlName="comentarios" rows="3" 
                      placeholder="Indique aspectos específicos que le interesen de la plataforma"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="demoForm.invalid" (click)="onSubmit()">
        Programar demostración
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .demo-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 350px;
      max-width: 600px;
    }
    
    .form-section {
      margin-bottom: 1.5rem;
    }
    
    h3 {
      margin-bottom: 1rem;
      color: #3f51b5;
      font-weight: 500;
    }
    
    .form-row {
      display: flex;
      gap: 1rem;
      width: 100%;
    }
    
    .form-row > * {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .demo-form {
        min-width: unset;
      }
    }
  `]
})
export class DemoRequestDialogComponent {
  demoForm: FormGroup;
  horasDisponibles: string[] = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '16:00', '16:30', '17:00', '17:30'
  ];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DemoRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MAT_DATE_LOCALE) private _locale: string,
    private dateAdapter: DateAdapter<Date>
  ) {    // Configurar el adaptador de fecha para español
    this.dateAdapter.setLocale(this._locale);
    
    // Obtener fecha mínima (mañana)
    const tomorrow = moment().add(1, 'days');
    
    // Inicializar formulario
    this.demoForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
      municipio: ['', Validators.required],
      cargo: [''],
      fecha: [tomorrow, Validators.required],
      hora: ['10:00', Validators.required],
      comentarios: ['']
    });
  }
  onSubmit(): void {
    if (this.demoForm.valid) {
      // Aquí se enviaría la información a un servicio backend
      console.log('Formulario enviado:', this.demoForm.value);
      
      // Cierra el diálogo y devuelve los datos del formulario
      this.dialogRef.close(this.demoForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
    // Formatea la fecha para mostrarla en español
  formatDate(date: moment.Moment): string {
    if (!date) return '';
    return date.locale('es').format('dddd, D [de] MMMM [de] YYYY');
  }
}
