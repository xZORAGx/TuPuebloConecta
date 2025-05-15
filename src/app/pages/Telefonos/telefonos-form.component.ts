// telefonos-form.component.ts

import { Component, inject, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
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
  // Debe coincidir exactamente con tu colección en Firestore:
  puebloGestionado = 'Figueruelas';

  telefonos$!: Observable<any[]>;
  form: FormGroup;
  editandoId: string | null = null;

  private firestore: Firestore = inject(Firestore);
  private fb: FormBuilder    = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]]
    });
  }

  ngOnInit(): void {
    const ref = collection(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Telefonos`
    );
    this.telefonos$ = collectionData(ref, { idField: 'id' });
  }

  async guardarTelefono() {
    if (this.form.invalid) {
      alert('Rellena correctamente los campos.');
      return;
    }

    const datos = this.form.value;
    try {
      if (this.editandoId) {
        const docRef = doc(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos/${this.editandoId}`
        );
        await updateDoc(docRef, datos);
        this.editandoId = null;
      } else {
        const ref = collection(
          this.firestore,
          `pueblos/${this.puebloGestionado}/Telefonos`
        );
        await addDoc(ref, datos);
      }
      this.form.reset();
    } catch (err) {
      console.error('Error guardando teléfono:', err);
      alert('Hubo un error al guardar. Revisa la consola.');
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

  async eliminarTelefono(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este teléfono?')) return;
    try {
      const docRef = doc(
        this.firestore,
        `pueblos/${this.puebloGestionado}/Telefonos/${id}`
      );
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error eliminando teléfono:', err);
      alert('No se pudo eliminar. Revisa la consola.');
    }
  }
}
