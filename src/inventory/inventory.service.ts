import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { formatDateOnly } from '../common/utils/date.util';
import { multiplyMoney, toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { ExpenseCategory } from '../expenses/constants/expense.constants';
import { ExpensesService } from '../expenses/expenses.service';
import {
  INVENTORY_SUB_CATEGORIES_BY_CATEGORY,
  InventoryCategory,
  InventoryRawMaterialGrade,
  InventoryRawMaterialSize,
  InventoryStatus,
  InventorySubCategory
} from './constants/inventory.constants';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventorySummaryResponseDto } from './dto/inventory-summary-response.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItem } from './entities/inventory-item.entity';
import { buildInventoryItemLabel } from './utils/inventory-label.util';

@Injectable()
export class InventoryService {
  constructor(
    private readonly expensesService: ExpensesService,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>
  ) {}

  async findAll(query: InventoryQueryDto): Promise<PaginatedResult<InventoryItemResponseDto>> {
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
    return buildPaginatedResult(items.map((item) => this.mapItem(item)), total, page, limit);
  }

  async findOne(id: number): Promise<InventoryItemResponseDto> {
    const item = await this.findEntityById(id);
    return this.mapItem(item);
  }

  async findEntityById(id: number): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    const item = this.inventoryRepository.create({
      ...dto,
      subCategory: this.resolveSubCategory(dto.category, dto.subCategory),
      rawMaterialSize: this.resolveRawMaterialSize(dto.category, dto.rawMaterialSize),
      rawMaterialGrade: this.resolveRawMaterialGrade(dto.category, dto.rawMaterialGrade),
      availableQuantity: dto.totalQuantity,
      consumedQuantity: 0,
      status: this.computeStatus(dto.totalQuantity, dto.totalQuantity)
    });
    const savedItem = await this.inventoryRepository.save(item);
    const totalPurchaseCost = multiplyMoney(savedItem.totalQuantity, savedItem.purchasePricePerUnit);

    if (totalPurchaseCost > 0) {
      await this.expensesService.createSystemExpense({
        category: this.getInventoryExpenseCategory(savedItem.category),
        subCategory: savedItem.subCategory ?? undefined,
        description: `Inventory purchase: ${buildInventoryItemLabel(savedItem)}`,
        amount: totalPurchaseCost,
        expenseDate: formatDateOnly(new Date()),
        notes: `Auto-generated from inventory item #${savedItem.id}. Quantity: ${Number(savedItem.totalQuantity)} ${savedItem.unit}. Unit price: ${Number(savedItem.purchasePricePerUnit)}.`
      });
    }

    return this.mapItem(savedItem);
  }

  async update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItemResponseDto> {
    const item = await this.findEntityById(id);
    const isTotalQuantityEdited = dto.totalQuantity !== undefined;
    const isAvailableQuantityEdited = dto.availableQuantity !== undefined;
    Object.assign(item, dto);

    if (isTotalQuantityEdited && !isAvailableQuantityEdited) {
      item.availableQuantity = this.resolveAvailableQuantityAfterTotalEdit(
        Number(item.totalQuantity),
        Number(item.consumedQuantity)
      );
    }

    if (isAvailableQuantityEdited) {
      item.availableQuantity = this.resolveAvailableQuantityAfterManualEdit(
        Number(item.availableQuantity),
        Number(item.totalQuantity),
        Number(item.consumedQuantity)
      );
    }

    item.subCategory = this.resolveSubCategory(item.category, item.subCategory ?? undefined);
    item.rawMaterialSize = this.resolveRawMaterialSize(item.category, item.rawMaterialSize ?? undefined);
    item.rawMaterialGrade = this.resolveRawMaterialGrade(item.category, item.rawMaterialGrade ?? undefined);
    item.status = this.computeStatus(Number(item.availableQuantity), Number(item.totalQuantity));
    return this.mapItem(await this.inventoryRepository.save(item));
  }

  async remove(id: number): Promise<DeleteResponseDto> {
    const item = await this.findEntityById(id);
    if (Number(item.consumedQuantity) > 0) {
      throw new ForbiddenException('Cannot delete inventory item after consumption');
    }
    await this.inventoryRepository.delete(id);
    return { deleted: true };
  }

  async summary(): Promise<InventorySummaryResponseDto> {
    const rows = await this.inventoryRepository
      .createQueryBuilder('item')
      .select('COUNT(item.id)', 'totalItems')
      .addSelect('COALESCE(SUM(item.availableQuantity * item.purchasePricePerUnit), 0)', 'remainingMaterialValue')
      .addSelect('COALESCE(SUM(item.consumedQuantity * item.purchasePricePerUnit), 0)', 'consumedMaterialValue')
      .addSelect("SUM(CASE WHEN item.status = 'LOW_STOCK' THEN 1 ELSE 0 END)", 'lowStockCount')
      .addSelect("SUM(CASE WHEN item.status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END)", 'outOfStockCount')
      .getRawOne<{
        totalItems: string;
        remainingMaterialValue: string;
        consumedMaterialValue: string;
        lowStockCount: string;
        outOfStockCount: string;
      }>();

    const remainingMaterialValue = toMoney(rows?.remainingMaterialValue ?? 0);
    const consumedMaterialValue = toMoney(rows?.consumedMaterialValue ?? 0);

    return {
      totalItems: Number(rows?.totalItems ?? 0),
      totalInventoryValue: remainingMaterialValue,
      remainingMaterialValue,
      consumedMaterialValue,
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
    return this.getRemainingMaterialValue(item);
  }

  getRemainingMaterialValue(item: InventoryItem): number {
    return multiplyMoney(item.availableQuantity, item.purchasePricePerUnit);
  }

  getConsumedMaterialValue(item: InventoryItem): number {
    return multiplyMoney(item.consumedQuantity, item.purchasePricePerUnit);
  }

  private getInventoryExpenseCategory(category: InventoryCategory): ExpenseCategory {
    const rawMaterialInputCategories = [
      InventoryCategory.RAW_MATERIAL,
      InventoryCategory.CONSUMABLE,
      InventoryCategory.HARDWARE,
      InventoryCategory.PAINT
    ];

    return rawMaterialInputCategories.includes(category) ? ExpenseCategory.RAW_MATERIAL : ExpenseCategory.OTHER;
  }

  private resolveAvailableQuantityAfterTotalEdit(totalQuantity: number, consumedQuantity: number): number {
    if (totalQuantity < consumedQuantity) {
      throw new BadRequestException(
        `Total quantity cannot be less than already consumed quantity (${consumedQuantity})`
      );
    }

    return toMoney(totalQuantity - consumedQuantity);
  }

  private resolveAvailableQuantityAfterManualEdit(
    availableQuantity: number,
    totalQuantity: number,
    consumedQuantity: number
  ): number {
    const maxAvailableQuantity = toMoney(totalQuantity - consumedQuantity);
    if (availableQuantity > maxAvailableQuantity) {
      throw new BadRequestException(
        `Available quantity cannot exceed total quantity minus consumed quantity (${maxAvailableQuantity})`
      );
    }

    return toMoney(availableQuantity);
  }

  private resolveRawMaterialSize(
    category: InventoryCategory,
    rawMaterialSize?: InventoryRawMaterialSize | null
  ): InventoryRawMaterialSize | null {
    if (category !== InventoryCategory.RAW_MATERIAL) {
      return null;
    }

    if (!rawMaterialSize) {
      throw new BadRequestException('Raw material size is required for raw material inventory items');
    }

    return rawMaterialSize;
  }

  private resolveRawMaterialGrade(
    category: InventoryCategory,
    rawMaterialGrade?: InventoryRawMaterialGrade | null
  ): InventoryRawMaterialGrade | null {
    if (category !== InventoryCategory.RAW_MATERIAL) {
      return null;
    }

    if (!rawMaterialGrade) {
      throw new BadRequestException('Raw material grade is required for raw material inventory items');
    }

    return rawMaterialGrade;
  }

  private resolveSubCategory(
    category: InventoryCategory,
    subCategory?: InventorySubCategory | null
  ): InventorySubCategory | null {
    const allowedSubCategories = INVENTORY_SUB_CATEGORIES_BY_CATEGORY[category] ?? [];

    if (allowedSubCategories.length === 0) {
      return null;
    }

    if (!subCategory) {
      throw new BadRequestException('Subcategory is required for this inventory category');
    }

    if (!allowedSubCategories.includes(subCategory)) {
      throw new BadRequestException(`Subcategory ${subCategory} is not valid for ${category}`);
    }

    return subCategory;
  }

  async assertAvailable(id: number, requestedQuantity: number): Promise<InventoryItem> {
    const item = await this.findEntityById(id);
    const availableQuantity = Number(item.availableQuantity);
    if (availableQuantity < requestedQuantity) {
      throw new BadRequestException(
        `Not enough stock for ${buildInventoryItemLabel(item)}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
      );
    }
    return item;
  }

  mapItem(item: InventoryItem): InventoryItemResponseDto {
    return {
      id: item.id,
      displayName: buildInventoryItemLabel(item),
      category: item.category,
      unit: item.unit,
      subCategory: item.subCategory,
      rawMaterialSize: item.rawMaterialSize,
      rawMaterialGrade: item.rawMaterialGrade,
      totalQuantity: Number(item.totalQuantity),
      availableQuantity: Number(item.availableQuantity),
      consumedQuantity: Number(item.consumedQuantity),
      purchasePricePerUnit: Number(item.purchasePricePerUnit),
      totalValue: this.getTotalValue(item),
      remainingMaterialValue: this.getRemainingMaterialValue(item),
      consumedMaterialValue: this.getConsumedMaterialValue(item),
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
