export interface Servicio {
  id?: string;
  titulo: string;
  descripcion?: string;  imagenUrl?: string;
  horarios?: {
    [key: string]: Horario;
  };
  timestamp: number;
}

export interface Horario {
  apertura: string;
  cierre: string;
}

export interface LineaBus {
  id?: string;
  nombreLinea: string;
  direccion: 'Figueruelas -> Zaragoza' | 'Zaragoza -> Figueruelas';
  horarios: string;
  timestamp: number;
}
