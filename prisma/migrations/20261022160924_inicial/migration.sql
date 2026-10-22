-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `entidades_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proyectos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `entidad_id` INTEGER NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `proyectos_entidad_id_nombre_key`(`entidad_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `proyecto_id` INTEGER NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lineas_proyecto_id_nombre_key`(`proyecto_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linea_id` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `monto` DECIMAL(12, 4) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagos_linea_id_fecha_idx`(`linea_id`, `fecha`),
    INDEX `pagos_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_informe` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `periodo` VARCHAR(60) NOT NULL,
    `referencia` VARCHAR(120) NOT NULL DEFAULT '',
    `titulo` VARCHAR(191) NOT NULL,
    `subtitulo` VARCHAR(191) NOT NULL,
    `moneda` CHAR(3) NOT NULL DEFAULT 'USD',
    `tasa_cambio_cop` DECIMAL(12, 2) NOT NULL,
    `pie_pagina` TEXT NOT NULL,
    `actualizado_en` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `proyectos` ADD CONSTRAINT `proyectos_entidad_id_fkey` FOREIGN KEY (`entidad_id`) REFERENCES `entidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lineas` ADD CONSTRAINT `lineas_proyecto_id_fkey` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_linea_id_fkey` FOREIGN KEY (`linea_id`) REFERENCES `lineas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
