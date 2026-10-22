import { LineaResumen } from '../../dominio/entidades/pago';
import { DatosPagoInvalidosError } from '../../dominio/errores/errores-pago';
import { LONGITUD_MAXIMA_NOMBRE } from '../../dominio/objetos-valor/datos-pago';
import { NuevaLinea, RepositorioPagos } from '../../dominio/puertos/repositorio-pagos';

const CAMPOS: { campo: keyof NuevaLinea; etiqueta: string }[] = [
  { campo: 'entidad', etiqueta: 'entidad' },
  { campo: 'proyecto', etiqueta: 'proyecto' },
  { campo: 'linea', etiqueta: 'línea' },
];

/**
 * Crea un proyecto dentro de una entidad y le asigna una línea de WhatsApp. Si la entidad o el
 * proyecto ya existen se reutilizan, así también sirve para añadir otra línea a un proyecto existente.
 */
export class CrearProyectoUseCase {
  constructor(private readonly repositorio: RepositorioPagos) {}

  async ejecutar(comando: NuevaLinea): Promise<LineaResumen> {
    const datos = { ...comando };
    for (const { campo, etiqueta } of CAMPOS) {
      const valor = comando[campo].trim();
      if (!valor) throw new DatosPagoInvalidosError(`El campo «${etiqueta}» es obligatorio`);
      if (valor.length > LONGITUD_MAXIMA_NOMBRE) {
        throw new DatosPagoInvalidosError(
          `El campo «${etiqueta}» supera ${LONGITUD_MAXIMA_NOMBRE} caracteres`,
        );
      }
      datos[campo] = valor;
    }
    return this.repositorio.crearLinea(datos);
  }
}
