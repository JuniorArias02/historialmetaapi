import { CorreoInvalidoError } from '../../src/modulos/usuarios/dominio/errores/errores-usuario';
import { Correo } from '../../src/modulos/usuarios/dominio/objetos-valor/correo';

describe('Correo', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(Correo.crear('  Ana.Perez@Empresa.COM ').valor).toBe('ana.perez@empresa.com');
  });

  it.each(['', 'sin-arroba', 'a@b', 'con espacio@empresa.com', `${'a'.repeat(190)}@x.co`])(
    'rechaza "%s"',
    (texto) => {
      expect(() => Correo.crear(texto)).toThrow(CorreoInvalidoError);
    },
  );
});
