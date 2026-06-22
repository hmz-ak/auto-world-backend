import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { ReceiptItem } from './entities/receipt-item.entity';
import { Receipt } from './entities/receipt.entity';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, ReceiptItem, RevenueEntry]),
    ClientsModule,
    PurchaseOrdersModule
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService, TypeOrmModule]
})
export class ReceiptsModule {}
