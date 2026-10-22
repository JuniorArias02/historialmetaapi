export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  correo: string;
}

export interface SesionIniciada {
  tokenAcceso: string;
  expiraEnSegundos: number;
  usuario: UsuarioAutenticado;
}
