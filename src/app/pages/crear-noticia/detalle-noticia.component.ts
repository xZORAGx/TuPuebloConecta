import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AmpliarImagenComponent } from './ampliar-imagen.component';

@Component({
  selector: 'app-detalle-noticia',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './detalle-noticia.component.html',
  styleUrls: ['./detalle-noticia.component.css']
})
export class DetalleNoticiaComponent implements OnInit {
  route = inject(ActivatedRoute);
  firestore = inject(Firestore);
  dialog = inject(MatDialog);

  noticia: any = null;
  puebloGestionado: string = 'Figueruelas';

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const docRef = doc(this.firestore, `pueblos/${this.puebloGestionado}/Noticias/${id}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.noticia = docSnap.data();
      }
    }
  }

  ampliarImagen(url: string) {
    this.dialog.open(AmpliarImagenComponent, {
      data: { imagenUrl: url },
      panelClass: 'dialogo-imagen'
    });
  }
}
