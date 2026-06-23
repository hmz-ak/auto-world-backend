import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ManufacturingProcessSheet } from './entities/manufacturing-process-sheet.entity';
import { ManufacturingController } from './manufacturing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, AuditLogItem, ManufacturingProcessSheet]),
    ClientsModule,
    InventoryModule,
    forwardRef(() => PurchaseOrdersModule)
  ],
  controllers: [AuditController, ManufacturingController],
  providers: [AuditService],
  exports: [AuditService, TypeOrmModule]
})
export class AuditModule {}
