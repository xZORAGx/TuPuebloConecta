import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface DemoRequest {
  nombre: string;
  email: string;
  telefono?: string;
  municipio: string;
  cargo?: string;
  fecha: Date;
  hora: string;
  comentarios?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DemoService {

  constructor() { }

  /**
   * Envía una solicitud de demostración
   * En un entorno real, esto se conectaría a un backend
   */
  enviarSolicitudDemo(request: DemoRequest): Observable<{success: boolean, message: string}> {
    // Simular una petición HTTP a un backend
    console.log('Enviando solicitud de demostración:', request);
    
    // Simulación de respuesta exitosa con un delay
    return of({
      success: true,
      message: 'Su solicitud ha sido recibida. Recibirá un correo de confirmación con los detalles de la videollamada.'
    }).pipe(delay(1000)); // Simulamos 1 segundo de retardo como si fuera una petición real
  }

  /**
   * Verifica disponibilidad de horarios para una fecha específica
   * En un entorno real, se consultaría al backend
   */
  getHorariosDisponibles(fecha: Date): Observable<string[]> {
    // En un caso real, esto consultaría la disponibilidad en el backend
    const horariosBase = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
      '12:00', '12:30', '13:00', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Simulamos que algunos horarios no están disponibles según el día
    const diaSemana = fecha.getDay();
    let horariosDisponibles = [...horariosBase];
    
    // Quitar algunos horarios aleatoriamente según el día para simular disponibilidad real
    if (diaSemana === 1 || diaSemana === 3) { // Lunes o Miércoles
      horariosDisponibles = horariosDisponibles.filter(h => !h.startsWith('09'));
    } else if (diaSemana === 2 || diaSemana === 4) { // Martes o Jueves
      horariosDisponibles = horariosDisponibles.filter(h => !h.startsWith('17'));
    } else if (diaSemana === 5) { // Viernes
      horariosDisponibles = horariosDisponibles.filter(h => !h.includes('16'));
    }
    
    return of(horariosDisponibles).pipe(delay(500));
  }
}
