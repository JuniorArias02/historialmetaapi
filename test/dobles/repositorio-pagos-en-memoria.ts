import { LineaResumen, Pago } from '../../src/modulos/pagos/dominio/entidades/pago';
import {
  CambiosPago,
  CriterioEliminacion,
  Importacion,
  NuevaLinea,
  NuevoPago,
  RepositorioPagos,
} from '../../src/modulos/pagos/dominio/puertos/repositorio-pagos';

export class RepositorioPagosEnMemoria implements RepositorioPagos {
  pagos: Pago[] = [];
  lineas: LineaResumen[] = [];
  ultimaImportacion: Importacion | null = null;
  private secuencia = 0;

  listar(): Promise<Pago[]> {
    return Promise.resolve([...this.pagos]);
  }

  listarLineas(): Promise<LineaResumen[]> {
    return Promise.resolve([...this.lineas]);
  }

  buscarLinea(id: number): Promise<LineaResumen | null> {
    return Promise.resolve(this.lineas.find((linea) => linea.id === id) ?? null);
  }

  crearLinea(datos: NuevaLinea): Promise<LineaResumen> {
    const linea = {
      id: this.lineas.length + 1,
      nombre: datos.linea,
      proyecto: datos.proyecto,
      entidad: datos.entidad,
    };
    this.lineas.push(linea);
    return Promise.resolve(linea);
  }

  buscarPorId(id: number): Promise<Pago | null> {
    return Promise.resolve(this.pagos.find((pago) => pago.id === id) ?? null);
  }

  crear(pago: NuevoPago): Promise<Pago> {
    const creado: Pago = { ...pago, id: ++this.secuencia, editado: false };
    this.pagos.push(creado);
    return Promise.resolve(creado);
  }

  actualizar(id: number, cambios: CambiosPago): Promise<Pago> {
    const indice = this.pagos.findIndex((pago) => pago.id === id);
    this.pagos[indice] = { ...this.pagos[indice], ...cambios };
    return Promise.resolve(this.pagos[indice]);
  }

  eliminar(criterio: CriterioEliminacion): Promise<number> {
    const antes = this.pagos.length;
    this.pagos = this.pagos.filter((pago) =>
      criterio.tipo === 'todos'
        ? false
        : criterio.tipo === 'ficticios'
          ? !pago.ficticio
          : !criterio.ids.includes(pago.id),
    );
    return Promise.resolve(antes - this.pagos.length);
  }

  importar(importacion: Importacion): Promise<number> {
    this.ultimaImportacion = importacion;
    return Promise.resolve(importacion.pagos.length);
  }
}
