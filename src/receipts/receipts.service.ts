import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { multiplyMoney, toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { RevenueEntry } from '../revenue/entities/revenue-entry.entity';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptPrintResponseDto } from './dto/receipt-print-response.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';
import { ReceiptListItemDto, ReceiptResponseDto } from './dto/receipt-response.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptItem } from './entities/receipt-item.entity';
import { Receipt } from './entities/receipt.entity';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientsService: ClientsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly dataSource: DataSource,
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
    @InjectRepository(ReceiptItem)
    private readonly receiptItemsRepository: Repository<ReceiptItem>,
    @InjectRepository(RevenueEntry)
    private readonly revenueRepository: Repository<RevenueEntry>
  ) {}

  async findAll(query: ReceiptQueryDto): Promise<PaginatedResult<ReceiptListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.client', 'client')
      .leftJoinAndSelect('receipt.purchaseOrder', 'purchaseOrder')
      .loadRelationCountAndMap('receipt.itemCount', 'receipt.items')
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
    return buildPaginatedResult(receipts.map((receipt) => this.mapListItem(receipt)), total, page, limit);
  }

  async findOne(id: number): Promise<ReceiptResponseDto> {
    const receipt = await this.findEntityById(id);
    return this.mapReceipt(receipt);
  }

  async findEntityById(id: number): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id },
      relations: { client: true, purchaseOrder: true, items: true }
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return receipt;
  }

  async create(dto: CreateReceiptDto): Promise<ReceiptResponseDto> {
    const client = await this.clientsService.findEntityById(dto.clientId);
    const purchaseOrder = dto.purchaseOrderId
      ? await this.purchaseOrdersService.findEntityById(dto.purchaseOrderId)
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
      carRegistrationNumber: dto.carRegistrationNumber ?? null,
      notes: dto.notes ?? null,
      items
    });
    const savedReceipt = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(Receipt, receipt);
      await this.upsertReceiptRevenue(saved, manager);
      return saved;
    });
    return this.findOne(savedReceipt.id);
  }

  async update(id: number, dto: UpdateReceiptDto): Promise<ReceiptResponseDto> {
    const receipt = await this.findEntityById(id);
    Object.assign(receipt, dto);
    if (typeof dto.taxAmount === 'number') {
      receipt.totalAmount = toMoney(Number(receipt.subtotal) + Number(dto.taxAmount));
    }
    const savedReceipt = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(Receipt, receipt);
      await this.upsertReceiptRevenue(saved, manager);
      return saved;
    });
    return this.findOne(savedReceipt.id);
  }

  async remove(id: number): Promise<DeleteResponseDto> {
    const receipt = await this.findEntityById(id);
    const linkedRevenue = await this.revenueRepository.findOne({ where: { receipt: { id: receipt.id } } });
    if (linkedRevenue) {
      throw new ForbiddenException('Cannot delete a receipt linked to revenue');
    }
    await this.receiptsRepository.delete(id);
    return { deleted: true };
  }

  async print(id: number): Promise<ReceiptPrintResponseDto> {
    const receipt = await this.findEntityById(id);
    return {
      ...this.mapReceipt(receipt),
      companyName: this.configService.get<string>('COMPANY_NAME') ?? 'Auto World',
      companyAddress: this.configService.get<string>('COMPANY_ADDRESS') ?? 'Lahore, Pakistan',
      companyPhone: '03334292983'
    };
  }

  private mapReceipt(receipt: Receipt): ReceiptResponseDto {
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      client: this.clientsService.mapClient(receipt.client),
      purchaseOrderId: receipt.purchaseOrder?.id ?? null,
      purchaseOrderNumber: receipt.purchaseOrder?.orderNumber ?? null,
      issueDate: receipt.issueDate as unknown as Date,
      subtotal: Number(receipt.subtotal),
      taxAmount: Number(receipt.taxAmount),
      totalAmount: Number(receipt.totalAmount),
      carRegistrationNumber: receipt.carRegistrationNumber,
      notes: receipt.notes,
      items: (receipt.items ?? []).map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      })),
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt
    };
  }

  private mapListItem(receipt: Receipt & { itemCount?: number }): ReceiptListItemDto {
    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      clientId: receipt.client.id,
      clientName: receipt.client.name,
      purchaseOrderId: receipt.purchaseOrder?.id ?? null,
      purchaseOrderNumber: receipt.purchaseOrder?.orderNumber ?? null,
      issueDate: receipt.issueDate as unknown as Date,
      totalAmount: Number(receipt.totalAmount),
      itemCount: receipt.itemCount ?? 0
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

  private async upsertReceiptRevenue(receipt: Receipt, manager: EntityManager): Promise<void> {
    const revenueRepository = manager.getRepository(RevenueEntry);
    const existingEntry = await revenueRepository.findOne({
      where: { receipt: { id: receipt.id } },
      relations: { receipt: true, client: true }
    });
    const revenueData = {
      client: receipt.client,
      receipt,
      amount: toMoney(receipt.totalAmount),
      description: `Receipt ${receipt.receiptNumber} from ${receipt.client.name}`,
      revenueDate: receipt.issueDate
    };

    if (existingEntry) {
      await revenueRepository.save(Object.assign(existingEntry, revenueData));
      return;
    }

    await revenueRepository.save(revenueRepository.create(revenueData));
  }
}
