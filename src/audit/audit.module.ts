import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, AuditLogItem]), InventoryModule, PurchaseOrdersModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService, TypeOrmModule]
})
export class AuditModule {}
