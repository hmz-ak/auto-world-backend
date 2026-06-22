import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { multiplyMoney, toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptItem } from './entities/receipt-item.entity';
import { Receipt } from './entities/receipt.entity';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
    @InjectRepository(ReceiptItem)
    private readonly receiptItemsRepository: Repository<ReceiptItem>,
    @InjectRepository(RevenueEntry)
    private readonly revenueRepository: Repository<RevenueEntry>
  ) {}

  async findAll(query: ReceiptQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.client', 'client')
      .leftJoinAndSelect('receipt.purchaseOrder', 'purchaseOrder')
      .orderBy('receipt.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.clientId) {
      builder.andWhere('client.id = :clientId', { clientId: query.clientId });
    }

    if (query.startDate) {
      builder.andWhere('receipt.issueDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      builder.andWhere('receipt.issueDate <= :endDate', { endDate: query.endDate });
    }

    const [receipts, total] = await builder.getManyAndCount();
    return buildPaginatedResult(receipts, total, page, limit);
  }

  async findOne(id: number): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id },
      relations: { client: true, purchaseOrder: true, items: true }
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return receipt;
  }

  async create(dto: CreateReceiptDto): Promise<Receipt> {
    const client = await this.clientsService.findOne(dto.clientId);
    const purchaseOrder = dto.purchaseOrderId
      ? await this.purchaseOrdersService.findOne(dto.purchaseOrderId)
      : null;
    const items = dto.lineItems.map((item) =>
      this.receiptItemsRepository.create({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: multiplyMoney(item.quantity, item.unitPrice)
      })
    );
    const subtotal = toMoney(items.reduce((sum, item) => sum + Number(item.totalPrice), 0));
    const taxAmount = toMoney(dto.taxAmount ?? 0);
    const receipt = this.receiptsRepository.create({
      client,
      purchaseOrder,
      receiptNumber: await this.generateReceiptNumber(dto.issueDate),
      issueDate: dto.issueDate,
      subtotal,
      taxAmount,
      totalAmount: toMoney(subtotal + taxAmount),
      notes: dto.notes ?? null,
      items
    });
    return this.receiptsRepository.save(receipt);
  }

  async update(id: number, dto: UpdateReceiptDto): Promise<Receipt> {
    const receipt = await this.findOne(id);
    Object.assign(receipt, dto);
    return this.receiptsRepository.save(receipt);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    const receipt = await this.findOne(id);
    const linkedRevenue = await this.revenueRepository.findOne({ where: { receipt: { id: receipt.id } } });
    if (linkedRevenue) {
      throw new ForbiddenException('Cannot delete a receipt linked to revenue');
    }
    await this.receiptsRepository.delete(id);
    return { deleted: true };
  }

  async print(id: number) {
    const receipt = await this.findOne(id);
    return {
      company: 'Auto World - Kamani Manufacturer, Lahore, Pakistan',
      receiptNumber: receipt.receiptNumber,
      issueDate: receipt.issueDate,
      clientName: receipt.client.name,
      items: receipt.items,
      subtotal: receipt.subtotal,
      taxAmount: receipt.taxAmount,
      totalAmount: receipt.totalAmount,
      notes: receipt.notes
    };
  }

  private async generateReceiptNumber(issueDate: string): Promise<string> {
    const compactDate = issueDate.replace(/-/g, '');
    const count = await this.receiptsRepository
      .createQueryBuilder('receipt')
      .where('receipt.receiptNumber LIKE :prefix', { prefix: `REC-${compactDate}-%` })
      .getCount();
    return `REC-${compactDate}-${String(count + 1).padStart(4, '0')}`;
  }
}
