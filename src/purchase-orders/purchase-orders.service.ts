import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { multiplyMoney, toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { PurchaseOrderStatus } from './constants/purchase-order.constants';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import {
  PurchaseOrderListItemDto,
  PurchaseOrderResponseDto
} from './dto/purchase-order-response.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly clientsService: ClientsService,
    @InjectRepository(PurchaseOrder)
    private readonly ordersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly itemsRepository: Repository<PurchaseOrderItem>
  ) {}

  async findAll(query: PurchaseOrderQueryDto): Promise<PaginatedResult<PurchaseOrderListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .loadRelationCountAndMap('order.itemCount', 'order.items')
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      builder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.clientId) {
      builder.andWhere('client.id = :clientId', { clientId: query.clientId });
    }

    const [orders, total] = await builder.getManyAndCount();
    return buildPaginatedResult(orders.map((order) => this.mapListItem(order)), total, page, limit);
  }

  async findOne(id: number): Promise<PurchaseOrderResponseDto> {
    const order = await this.findEntityById(id);
    return this.mapOrder(order);
  }

  async findEntityById(id: number): Promise<PurchaseOrder> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { client: true, items: true }
    });
    if (!order) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }
    return order;
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const client = await this.clientsService.findEntityById(dto.clientId);
    const order = this.ordersRepository.create({
      client,
      orderNumber: await this.generateOrderNumber(dto.orderDate),
      orderDate: dto.orderDate,
      deliveryDate: dto.deliveryDate ?? null,
      status: PurchaseOrderStatus.PENDING,
      notes: dto.notes ?? null,
      totalAmount: 0
    });
    order.items = dto.lineItems.map((item) =>
      this.itemsRepository.create({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: multiplyMoney(item.quantity, item.unitPrice)
      })
    );
    order.totalAmount = toMoney(order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0));
    const savedOrder = await this.ordersRepository.save(order);
    return this.findOne(savedOrder.id);
  }

  async update(id: number, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    const order = await this.findEntityById(id);
    Object.assign(order, dto);
    const savedOrder = await this.ordersRepository.save(order);
    return this.findOne(savedOrder.id);
  }

  async updateStatus(id: number, status: PurchaseOrderStatus): Promise<PurchaseOrderResponseDto> {
    return this.update(id, { status });
  }

  async cancel(id: number): Promise<PurchaseOrderResponseDto> {
    const order = await this.findEntityById(id);
    if (order.status === PurchaseOrderStatus.COMPLETED) {
      throw new ForbiddenException('Completed orders cannot be cancelled');
    }
    order.status = PurchaseOrderStatus.CANCELLED;
    const savedOrder = await this.ordersRepository.save(order);
    return this.findOne(savedOrder.id);
  }

  private mapOrder(order: PurchaseOrder): PurchaseOrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      client: this.clientsService.mapClient(order.client),
      orderDate: order.orderDate as unknown as Date,
      deliveryDate: order.deliveryDate as unknown as Date | null,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  private mapListItem(order: PurchaseOrder & { itemCount?: number }): PurchaseOrderListItemDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.client.id,
      clientName: order.client.name,
      orderDate: order.orderDate as unknown as Date,
      deliveryDate: order.deliveryDate as unknown as Date | null,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemCount: order.itemCount ?? 0
    };
  }

  private async generateOrderNumber(orderDate: string): Promise<string> {
    const compactDate = orderDate.replace(/-/g, '');
    const count = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `PO-${compactDate}-%` })
      .getCount();
    return `PO-${compactDate}-${String(count + 1).padStart(4, '0')}`;
  }
}
