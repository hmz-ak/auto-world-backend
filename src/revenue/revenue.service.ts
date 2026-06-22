import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { ReceiptsService } from '../receipts/receipts.service';
import { CreateRevenueEntryDto } from './dto/create-revenue-entry.dto';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { UpdateRevenueEntryDto } from './dto/update-revenue-entry.dto';
import { RevenueEntry } from './entities/revenue-entry.entity';

@Injectable()
export class RevenueService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly receiptsService: ReceiptsService,
    @InjectRepository(RevenueEntry)
    private readonly revenueRepository: Repository<RevenueEntry>
  ) {}

  async findAll(query: RevenueQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.revenueRepository
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.client', 'client')
      .leftJoinAndSelect('revenue.receipt', 'receipt')
      .orderBy('revenue.revenueDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyDateFilters(builder, query.startDate, query.endDate);
    if (query.clientId) {
      builder.andWhere('client.id = :clientId', { clientId: query.clientId });
    }

    const [entries, total] = await builder.getManyAndCount();
    return buildPaginatedResult(entries, total, page, limit);
  }

  async findOne(id: number): Promise<RevenueEntry> {
    const entry = await this.revenueRepository.findOne({
      where: { id },
      relations: { client: true, receipt: true }
    });
    if (!entry) {
      throw new NotFoundException(`Revenue entry with ID ${id} not found`);
    }
    return entry;
  }

  async create(dto: CreateRevenueEntryDto): Promise<RevenueEntry> {
    const client = dto.clientId ? await this.clientsService.findOne(dto.clientId) : null;
    const receipt = dto.receiptId ? await this.receiptsService.findOne(dto.receiptId) : null;
    return this.revenueRepository.save(this.revenueRepository.create({ ...dto, client, receipt }));
  }

  async update(id: number, dto: UpdateRevenueEntryDto): Promise<RevenueEntry> {
    const entry = await this.findOne(id);
    const client = dto.clientId ? await this.clientsService.findOne(dto.clientId) : entry.client;
    const receipt = dto.receiptId ? await this.receiptsService.findOne(dto.receiptId) : entry.receipt;
    Object.assign(entry, dto, { client, receipt });
    return this.revenueRepository.save(entry);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.revenueRepository.delete(id);
    return { deleted: true };
  }

  async summary(query: RevenueQueryDto) {
    const builder = this.revenueRepository
      .createQueryBuilder('revenue')
      .select('COALESCE(SUM(revenue.amount), 0)', 'totalRevenue')
      .addSelect('COUNT(revenue.id)', 'entryCount');
    this.applyDateFilters(builder, query.startDate, query.endDate);
    const row = await builder.getRawOne<{ totalRevenue: string; entryCount: string }>();
    return {
      totalRevenue: toMoney(row?.totalRevenue ?? 0),
      entryCount: Number(row?.entryCount ?? 0),
      dateRange: { from: query.startDate ?? null, to: query.endDate ?? null }
    };
  }

  async sumBetween(startDate?: string, endDate?: string): Promise<number> {
    const builder = this.revenueRepository
      .createQueryBuilder('revenue')
      .select('COALESCE(SUM(revenue.amount), 0)', 'total');
    this.applyDateFilters(builder, startDate, endDate);
    const row = await builder.getRawOne<{ total: string }>();
    return toMoney(row?.total ?? 0);
  }

  private applyDateFilters(builder: ReturnType<Repository<RevenueEntry>['createQueryBuilder']>, startDate?: string, endDate?: string): void {
    if (startDate) {
      builder.andWhere('revenue.revenueDate >= :startDate', { startDate });
    }
    if (endDate) {
      builder.andWhere('revenue.revenueDate <= :endDate', { endDate });
    }
  }
}
