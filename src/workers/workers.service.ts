import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { formatDateOnly, getSaturdayWeekNumber, isSaturday } from '../common/utils/date.util';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { AdvancePayment } from './entities/advance-payment.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Worker } from './entities/worker.entity';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Worker)
    private readonly workersRepository: Repository<Worker>,
    @InjectRepository(AdvancePayment)
    private readonly advancesRepository: Repository<AdvancePayment>,
    @InjectRepository(SalaryPayment)
    private readonly salaryPaymentsRepository: Repository<SalaryPayment>
  ) {}

  async findAll(page = 1, limit = 20) {
    const [workers, total] = await this.workersRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return buildPaginatedResult(workers, total, page, limit);
  }

  async findOne(id: number): Promise<Worker> {
    const worker = await this.workersRepository.findOne({
      where: { id },
      relations: { advances: true, salaryPayments: true }
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async create(dto: CreateWorkerDto): Promise<Worker> {
    const worker = this.workersRepository.create({
      ...dto,
      weeklySalary: toMoney(dto.monthlySalary / 4),
      pendingAdvance: 0,
      isActive: true
    });
    return this.workersRepository.save(worker);
  }

  async update(id: number, dto: UpdateWorkerDto): Promise<Worker> {
    const worker = await this.findOne(id);
    Object.assign(worker, dto);
    if (typeof dto.monthlySalary === 'number') {
      worker.weeklySalary = toMoney(dto.monthlySalary / 4);
    }
    return this.workersRepository.save(worker);
  }

  async softDelete(id: number): Promise<Worker> {
    const worker = await this.findOne(id);
    worker.isActive = false;
    return this.workersRepository.save(worker);
  }

  async recordAdvance(workerId: number, dto: CreateAdvanceDto): Promise<AdvancePayment> {
    const worker = await this.findOne(workerId);
    worker.pendingAdvance = toMoney(Number(worker.pendingAdvance) + dto.amount);
    const advance = this.advancesRepository.create({
      worker,
      amount: dto.amount,
      reason: dto.reason ?? null,
      takenOn: dto.takenOn,
      isDeducted: false
    });
    await this.workersRepository.save(worker);
    return this.advancesRepository.save(advance);
  }

  async listAdvances(workerId: number): Promise<AdvancePayment[]> {
    await this.findOne(workerId);
    return this.advancesRepository.find({
      where: { worker: { id: workerId } },
      order: { takenOn: 'DESC' }
    });
  }

  async listSalaryHistory(workerId: number): Promise<SalaryPayment[]> {
    await this.findOne(workerId);
    return this.salaryPaymentsRepository.find({
      where: { worker: { id: workerId } },
      order: { paymentDate: 'DESC' }
    });
  }

  async processAllSalaries(dto: ProcessSalaryDto) {
    const workers = await this.workersRepository.find({ where: { isActive: true } });
    return this.processSalaryBatch(workers, dto);
  }

  async processWorkerSalary(workerId: number, dto: ProcessSalaryDto) {
    const worker = await this.findOne(workerId);
    return this.processSalaryBatch([worker], dto);
  }

  async getSalaryPreview(): Promise<Array<{ worker: Worker; netPayment: number }>> {
    const workers = await this.workersRepository.find({ where: { isActive: true } });
    return workers.map((worker) => ({
      worker,
      netPayment: Math.max(0, toMoney(Number(worker.weeklySalary) - Number(worker.pendingAdvance)))
    }));
  }

  private async processSalaryBatch(workers: Worker[], dto: ProcessSalaryDto) {
    const today = new Date();
    if (!dto.force && !isSaturday(today)) {
      throw new BadRequestException('Salary can only be processed on Saturdays.');
    }

    const paymentDate = formatDateOnly(today);
    const weekNumber = getSaturdayWeekNumber(today);

    return this.dataSource.transaction(async (manager) => {
      let totalPaid = 0;
      let totalAdvanceDeducted = 0;

      for (const worker of workers) {
        const grossAmount = toMoney(worker.weeklySalary);
        const pendingAdvance = toMoney(worker.pendingAdvance);
        const advanceDeducted = Math.min(grossAmount, pendingAdvance);
        const netAmount = toMoney(grossAmount - advanceDeducted);
        const carryOverAdvance = toMoney(pendingAdvance - advanceDeducted);

        await manager.save(
          manager.create(SalaryPayment, {
            worker,
            paymentDate,
            weekNumber,
            grossAmount,
            advanceDeducted,
            netAmount,
            notes: null
          })
        );

        await manager.update(Worker, worker.id, { pendingAdvance: carryOverAdvance });
        await manager.update(AdvancePayment, { worker: { id: worker.id }, isDeducted: false }, { isDeducted: true });
        totalPaid = toMoney(totalPaid + netAmount);
        totalAdvanceDeducted = toMoney(totalAdvanceDeducted + advanceDeducted);
      }

      return {
        processed: workers.length,
        totalPaid,
        totalAdvanceDeducted
      };
    });
  }
}
