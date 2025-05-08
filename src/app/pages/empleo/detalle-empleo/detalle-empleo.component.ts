// src/app/pages/empleo/detalle-empleo/detalle-empleo.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { deleteDoc } from 'firebase/firestore';

import {
  Storage,
  ref as storageRef,
  deleteObject
} from '@angular/fire/storage';

import { AmpliarImagenComponent } from '../ampliar-imagen/ampliar-imagen.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-detalle-empleo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './detalle-empleo.component.html',
  styleUrls: ['./detalle-empleo.component.css']
})
export class DetalleEmpleoComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private firestore = inject(Firestore);
  private storage   = inject(Storage);
  private dialog    = inject(MatDialog);

  empleo: any = null;
  puebloGestionado = 'Figueruelas';

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const refDoc = doc(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Empleo/${id}`
    );
    const snap = await getDoc(refDoc);
    if (snap.exists()) {
      this.empleo = snap.data();
    }
  }

  ampliarImagen(url: string) {
    this.dialog.open(AmpliarImagenComponent, {
      data: { imagenUrl: url },
      panelClass: 'dialogo-imagen'
    });
  }

  async eliminarEmpleo() {
    // 1️⃣ confirm
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: { mensaje: '¿Eliminar esta oferta de empleo?' }
    });
    const ok = await confirmRef.afterClosed().toPromise();
    if (!ok) return;

    // 2️⃣ borrar imagen de Storage si existe
    if (this.empleo.imagenURL) {
      const url = this.empleo.imagenURL as string;
      const start = url.indexOf('/o/') + 3;
      const end   = url.indexOf('?');
      const path  = decodeURIComponent(url.substring(start, end));
      const imgRef = storageRef(this.storage, path);
      await deleteObject(imgRef);
    }

    // 3️⃣ borrar documento de Firestore
    const id = this.route.snapshot.paramMap.get('id')!;
    const docRef = doc(
      this.firestore,
      `pueblos/${this.puebloGestionado}/Empleo/${id}`
    );
    await deleteDoc(docRef);

    // 4️⃣ navegar de vuelta al listado
    this.router.navigate(['/empleo']);
  }
}
