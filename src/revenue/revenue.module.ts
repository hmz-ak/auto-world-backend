import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { RevenueEntry } from './entities/revenue-entry.entity';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

@Module({
  imports: [TypeOrmModule.forFeature([RevenueEntry]), ClientsModule, ReceiptsModule],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService, TypeOrmModule]
})
export class RevenueModule {}
