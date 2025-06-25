export interface Noticia {
    id?: string;
    titulo: string;
    descripcion: string;
    imagenURL?: string;
    timestamp: number;
    fechaExpiracion: Date;  // Nueva propiedad para la fecha de caducidad
}
