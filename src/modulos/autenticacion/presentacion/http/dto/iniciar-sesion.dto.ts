import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class IniciarSesionDto {
  @ApiProperty({ example: 'admin@empresa.com', maxLength: 191 })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(191, { message: 'El correo no puede superar 191 caracteres' })
  correo!: string;

  @ApiProperty({ example: '********', maxLength: 128 })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres' })
  contrasena!: string;
}
