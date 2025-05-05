import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-telefonos-form',
  standalone: true,
  templateUrl: './telefonos-form.component.html',
  styleUrls: ['./telefonos-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class TelefonosFormComponent implements OnInit {
  puebloGestionado = 'figueruelas';
  telefonos$: Observable<any[]>;
  form: FormGroup;
  editandoId: string | null = null;

  private firestore: Firestore = inject(Firestore);
  private fb: FormBuilder = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });

    const ref = collection(this.firestore, `pueblos/${this.puebloGestionado}/Telefonos`);
    this.telefonos$ = collectionData(ref, { idField: 'id' });
  }

  ngOnInit(): void {}

  guardarTelefono() {
    if (this.form.invalid) {
      alert('Rellena correctamente los campos.');
      return;
    }

    const datos = this.form.value;

    if (this.editandoId) {
      const docRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`);
      updateDoc(docRef, datos).then(() => {
        this.editandoId = null;
        this.form.reset();
      });
    } else {
      const ref = collection(this.firestore, `pueblos/${this.puebloGestionado}/Telefonos`);
      addDoc(ref, datos).then(() => this.form.reset());
    }
  }

  editarTelefono(tel: any) {
    this.editandoId = tel.id;
    this.form.setValue({
      nombre: tel.nombre,
      numero: tel.numero
    });
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.form.reset();
  }

  eliminarTelefono(id: string) {
    if (confirm('¿Seguro que quieres eliminar este teléfono?')) {
      const docRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Telefonos/${id}`);
      deleteDoc(docRef);
    }
  }
}
