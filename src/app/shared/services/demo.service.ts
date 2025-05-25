import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { delay, catchError, map } from 'rxjs/operators';
import emailjs from '@emailjs/browser';
import moment from 'moment';

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
  private readonly EMAIL_SERVICE_ID = 'service_1ck74mj'; 
  private readonly EMAIL_TEMPLATE_ID = 'template_1zxwe0f'; 
  private readonly EMAIL_PUBLIC_KEY = 'kON92sICtmYj6iODZ'; 
  private readonly DESTINO_EMAIL = 'tupuebloconecta@gmail.com';

  constructor() {
    emailjs.init(this.EMAIL_PUBLIC_KEY);
  }

  /**
   * Envía una solicitud de demostración
   * En un entorno real, esto se conectaría a un backend
   */
  enviarSolicitudDemo(request: DemoRequest): Observable<{success: boolean, message: string}> {
    // Ensure 'fecha' is a JavaScript Date object
    let fechaJs: Date;
    if (moment.isMoment(request.fecha)) {
      fechaJs = (request.fecha as moment.Moment).toDate();
    } else if (request.fecha instanceof Date) {
      fechaJs = request.fecha;
    } else if (typeof request.fecha === 'string' || typeof request.fecha === 'number') {
      fechaJs = moment(request.fecha).toDate();
    } else {
      // Fallback or error handling if fecha is not in an expected format
      console.error('Formato de fecha no reconocido:', request.fecha);
      // Default to current date or handle as an error
      fechaJs = new Date(); 
    }

    const templateParams = {
      to_email: this.DESTINO_EMAIL,
      from_name: request.nombre,
      from_email: request.email,
      telefono: request.telefono || 'No proporcionado',
      municipio: request.municipio,
      cargo: request.cargo || 'No proporcionado',
      fecha: fechaJs.toLocaleDateString(), // Use the converted JS Date
      hora: request.hora,
      comentarios: request.comentarios || 'Sin comentarios adicionales'
    };

    return from(emailjs.send(
      this.EMAIL_SERVICE_ID,
      this.EMAIL_TEMPLATE_ID,
      templateParams
    )).pipe(
      map(() => ({
        success: true,
        message: 'Su solicitud ha sido recibida y se ha enviado un correo de confirmación.'
      })),
      catchError(error => {
        console.error('Error al enviar el correo:', error);
        return of({
          success: false,
          message: 'Hubo un error al procesar su solicitud. Por favor, inténtelo de nuevo.'
        });
      })
    );
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
