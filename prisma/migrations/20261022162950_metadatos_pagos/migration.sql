-- AlterTable
ALTER TABLE `pagos` ADD COLUMN `actualizado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `advertencias` JSON NULL,
    ADD COLUMN `editado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ficticio` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nota` VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN `origen` VARCHAR(255) NOT NULL DEFAULT 'importado',
    ADD COLUMN `original` JSON NULL,
    ADD COLUMN `ubicacion` VARCHAR(255) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `pagos_ficticio_idx` ON `pagos`(`ficticio`);

-- Los pagos existentes provienen del seed inicial con datos_cobros.json.
UPDATE `pagos` SET `origen` = 'datos_cobros.json' WHERE `origen` = 'importado';
