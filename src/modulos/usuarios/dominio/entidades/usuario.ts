export interface PropiedadesUsuario {
  id: number;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  activo: boolean;
}

export class Usuario {
  constructor(private readonly propiedades: PropiedadesUsuario) {}

  get id(): number {
    return this.propiedades.id;
  }

  get nombre(): string {
    return this.propiedades.nombre;
  }

  get correo(): string {
    return this.propiedades.correo;
  }

  get contrasenaHash(): string {
    return this.propiedades.contrasenaHash;
  }

  get activo(): boolean {
    return this.propiedades.activo;
  }
}
