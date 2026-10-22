import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export const ENTORNOS = ['development', 'production', 'test'] as const;
export type Entorno = (typeof ENTORNOS)[number];

export class VariablesEntorno {
  @IsIn(ENTORNOS)
  NODE_ENV: Entorno = 'development';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PUERTO = 3000;

  /** Lista de orígenes separados por coma. Nunca se usa "*". */
  @IsString()
  @Matches(/^https?:\/\/[^\s,]+(,https?:\/\/[^\s,]+)*$/, {
    message: 'CORS_ORIGENES debe ser una lista de URLs http(s) separadas por coma',
  })
  CORS_ORIGENES!: string;

  @IsString()
  @Matches(/^mysql:\/\//, { message: 'DATABASE_URL debe ser una URL mysql://' })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRETO debe tener al menos 32 caracteres' })
  JWT_SECRETO!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(60)
  JWT_EXPIRACION_SEGUNDOS = 28800;

  /**
   * true cuando la API está detrás de un proxy inverso (Nginx). Sin esto, todas las peticiones
   * parecen venir del proxy y el límite de intentos de inicio de sesión se compartiría entre todos.
   */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  CONFIAR_PROXY = false;
}

/** Se ejecuta al arrancar: si falta o es inválida alguna variable, la aplicación no inicia. */
export function validarEntorno(configuracion: Record<string, unknown>): VariablesEntorno {
  const variables = plainToInstance(VariablesEntorno, configuracion, {
    exposeDefaultValues: true,
  });
  const errores = validateSync(variables, { skipMissingProperties: false });
  if (errores.length > 0) {
    const detalle = errores.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new Error(`Variables de entorno inválidas:\n- ${detalle.join('\n- ')}`);
  }
  return variables;
}
