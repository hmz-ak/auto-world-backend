import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { multiplyMoney, toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { InventoryStatus } from './constants/inventory.constants';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItem } from './entities/inventory-item.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>
  ) {}

  async findAll(query: InventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.inventoryRepository
      .createQueryBuilder('item')
      .orderBy('item.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      builder.andWhere('item.status = :status', { status: query.status });
    }

    if (query.category) {
      builder.andWhere('item.category = :category', { category: query.category });
    }

    const [items, total] = await builder.getManyAndCount();
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: number): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.inventoryRepository.create({
      ...dto,
      availableQuantity: dto.totalQuantity,
      consumedQuantity: 0,
      status: this.computeStatus(dto.totalQuantity, dto.totalQuantity)
    });
    return this.inventoryRepository.save(item);
  }

  async update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    item.status = this.computeStatus(Number(item.availableQuantity), Number(item.totalQuantity));
    return this.inventoryRepository.save(item);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    const item = await this.findOne(id);
    if (Number(item.consumedQuantity) > 0) {
      throw new ForbiddenException('Cannot delete inventory item after consumption');
    }
    await this.inventoryRepository.delete(id);
    return { deleted: true };
  }

  async summary() {
    const rows = await this.inventoryRepository
      .createQueryBuilder('item')
      .select('COUNT(item.id)', 'totalItems')
      .addSelect('COALESCE(SUM(item.availableQuantity * item.purchasePricePerUnit), 0)', 'totalValue')
      .addSelect("SUM(CASE WHEN item.status = 'LOW_STOCK' THEN 1 ELSE 0 END)", 'lowStockCount')
      .addSelect("SUM(CASE WHEN item.status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END)", 'outOfStockCount')
      .getRawOne<{
        totalItems: string;
        totalValue: string;
        lowStockCount: string;
        outOfStockCount: string;
      }>();

    return {
      totalItems: Number(rows?.totalItems ?? 0),
      totalValue: toMoney(rows?.totalValue ?? 0),
      lowStockCount: Number(rows?.lowStockCount ?? 0),
      outOfStockCount: Number(rows?.outOfStockCount ?? 0)
    };
  }

  computeStatus(availableQuantity: number, totalQuantity: number): InventoryStatus {
    if (availableQuantity === 0) {
      return InventoryStatus.OUT_OF_STOCK;
    }

    const lowStockThreshold = totalQuantity * 0.1;
    if (availableQuantity > 0 && availableQuantity < lowStockThreshold) {
      return InventoryStatus.LOW_STOCK;
    }

    return InventoryStatus.AVAILABLE;
  }

  getTotalValue(item: InventoryItem): number {
    return multiplyMoney(item.availableQuantity, item.purchasePricePerUnit);
  }

  async assertAvailable(id: number, requestedQuantity: number): Promise<InventoryItem> {
    const item = await this.findOne(id);
    const availableQuantity = Number(item.availableQuantity);
    if (availableQuantity < requestedQuantity) {
      throw new BadRequestException(
        `Not enough stock for ${item.name}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
      );
    }
    return item;
  }
}
