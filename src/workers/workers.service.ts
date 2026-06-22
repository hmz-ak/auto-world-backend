import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { formatDateOnly, getSaturdayWeekNumber, isSaturday } from '../common/utils/date.util';
import { toMoney } from '../common/utils/money.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { AdvancePayment } from './entities/advance-payment.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Worker } from './entities/worker.entity';
import { AdvancePaymentResponseDto } from './dto/advance-payment-response.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { SalaryPaymentResponseDto } from './dto/salary-payment-response.dto';
import { SalaryPreviewResponseDto } from './dto/salary-preview-response.dto';
import { SalaryProcessResultDto } from './dto/salary-process-result.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerResponseDto } from './dto/worker-response.dto';

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

  async findAll(page = 1, limit = 20): Promise<PaginatedResult<WorkerResponseDto>> {
    const [workers, total] = await this.workersRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return buildPaginatedResult(workers.map((worker) => this.mapWorker(worker)), total, page, limit);
  }

  async findOne(id: number): Promise<WorkerResponseDto> {
    const worker = await this.findEntityById(id);
    return this.mapWorker(worker);
  }

  async findEntityById(id: number): Promise<Worker> {
    const worker = await this.workersRepository.findOne({
      where: { id }
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async create(dto: CreateWorkerDto): Promise<WorkerResponseDto> {
    const worker = this.workersRepository.create({
      ...dto,
      weeklySalary: toMoney(dto.monthlySalary / 4),
      pendingAdvance: 0,
      isActive: true
    });
    return this.mapWorker(await this.workersRepository.save(worker));
  }

  async update(id: number, dto: UpdateWorkerDto): Promise<WorkerResponseDto> {
    const worker = await this.findEntityById(id);
    Object.assign(worker, dto);
    if (typeof dto.monthlySalary === 'number') {
      worker.weeklySalary = toMoney(dto.monthlySalary / 4);
    }
    return this.mapWorker(await this.workersRepository.save(worker));
  }

  async softDelete(id: number): Promise<WorkerResponseDto> {
    const worker = await this.findEntityById(id);
    worker.isActive = false;
    return this.mapWorker(await this.workersRepository.save(worker));
  }

  async recordAdvance(workerId: number, dto: CreateAdvanceDto): Promise<AdvancePaymentResponseDto> {
    const worker = await this.findEntityById(workerId);
    worker.pendingAdvance = toMoney(Number(worker.pendingAdvance) + dto.amount);
    const advance = this.advancesRepository.create({
      worker,
      amount: dto.amount,
      reason: dto.reason ?? null,
      takenOn: dto.takenOn,
      isDeducted: false
    });
    await this.workersRepository.save(worker);
    return this.mapAdvance(await this.advancesRepository.save(advance));
  }

  async listAdvances(workerId: number): Promise<AdvancePaymentResponseDto[]> {
    await this.findEntityById(workerId);
    const advances = await this.advancesRepository.find({
      where: { worker: { id: workerId } },
      relations: { worker: true },
      order: { takenOn: 'DESC' }
    });
    return advances.map((advance) => this.mapAdvance(advance));
  }

  async listSalaryHistory(workerId: number): Promise<SalaryPaymentResponseDto[]> {
    await this.findEntityById(workerId);
    const payments = await this.salaryPaymentsRepository.find({
      where: { worker: { id: workerId } },
      relations: { worker: true },
      order: { paymentDate: 'DESC' }
    });
    return payments.map((payment) => this.mapSalaryPayment(payment));
  }

  async processAllSalaries(dto: ProcessSalaryDto): Promise<SalaryProcessResultDto> {
    const workers = await this.workersRepository.find({ where: { isActive: true } });
    return this.processSalaryBatch(workers, dto);
  }

  async processWorkerSalary(workerId: number, dto: ProcessSalaryDto): Promise<SalaryProcessResultDto> {
    const worker = await this.findEntityById(workerId);
    return this.processSalaryBatch([worker], dto);
  }

  async getSalaryPreview(): Promise<SalaryPreviewResponseDto> {
    const workers = await this.workersRepository.find({ where: { isActive: true } });
    const today = new Date();
    const paymentDate = this.getCurrentOrUpcomingSaturday(today);
    const previewWorkers = workers.map((worker) => {
      const weeklySalary = toMoney(worker.weeklySalary);
      const pendingAdvance = toMoney(worker.pendingAdvance);
      return {
        workerId: worker.id,
        workerName: worker.name,
        weeklySalary,
        pendingAdvance,
        netPayment: Math.max(0, toMoney(weeklySalary - pendingAdvance))
      };
    });
    const totalGross = toMoney(previewWorkers.reduce((sum, worker) => sum + worker.weeklySalary, 0));
    const totalAdvanceToDeduct = toMoney(
      previewWorkers.reduce((sum, worker) => sum + Math.min(worker.weeklySalary, worker.pendingAdvance), 0)
    );
    const totalNet = toMoney(previewWorkers.reduce((sum, worker) => sum + worker.netPayment, 0));

    return {
      paymentDate: formatDateOnly(paymentDate) as unknown as Date,
      weekNumber: getSaturdayWeekNumber(paymentDate),
      isTodaySaturday: isSaturday(today),
      workers: previewWorkers,
      totalGross,
      totalAdvanceToDeduct,
      totalNet
    };
  }

  private async processSalaryBatch(workers: Worker[], dto: ProcessSalaryDto): Promise<SalaryProcessResultDto> {
    const today = new Date();
    if (!dto.force && !isSaturday(today)) {
      throw new BadRequestException('Salary can only be processed on Saturdays.');
    }

    const paymentDate = formatDateOnly(today);
    const weekNumber = getSaturdayWeekNumber(today);

    return this.dataSource.transaction(async (manager) => {
      let totalGrossPaid = 0;
      let totalNetPaid = 0;
      let totalAdvanceDeducted = 0;
      const payments: SalaryPaymentResponseDto[] = [];

      for (const worker of workers) {
        const grossAmount = toMoney(worker.weeklySalary);
        const pendingAdvance = toMoney(worker.pendingAdvance);
        const advanceDeducted = Math.min(grossAmount, pendingAdvance);
        const netAmount = toMoney(grossAmount - advanceDeducted);
        const carryOverAdvance = toMoney(pendingAdvance - advanceDeducted);

        const payment = await manager.save(
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
        payments.push(this.mapSalaryPayment(payment));
        totalGrossPaid = toMoney(totalGrossPaid + grossAmount);
        totalNetPaid = toMoney(totalNetPaid + netAmount);
        totalAdvanceDeducted = toMoney(totalAdvanceDeducted + advanceDeducted);
      }

      return {
        processed: workers.length,
        totalGrossPaid,
        totalAdvanceDeducted,
        totalNetPaid,
        paymentDate: paymentDate as unknown as Date,
        payments
      };
    });
  }

  private getCurrentOrUpcomingSaturday(date: Date): Date {
    const candidate = new Date(date);
    const daysUntilSaturday = (6 - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + daysUntilSaturday);
    return candidate;
  }

  private mapWorker(worker: Worker): WorkerResponseDto {
    return {
      id: worker.id,
      name: worker.name,
      cnic: worker.cnic,
      phone: worker.phone,
      role: worker.role,
      monthlySalary: Number(worker.monthlySalary),
      weeklySalary: Number(worker.weeklySalary),
      pendingAdvance: Number(worker.pendingAdvance),
      joiningDate: worker.joiningDate as unknown as Date,
      isActive: worker.isActive,
      createdAt: worker.createdAt
    };
  }

  private mapAdvance(advance: AdvancePayment): AdvancePaymentResponseDto {
    return {
      id: advance.id,
      workerId: advance.worker.id,
      workerName: advance.worker.name,
      amount: Number(advance.amount),
      reason: advance.reason,
      takenOn: advance.takenOn as unknown as Date,
      isDeducted: advance.isDeducted,
      createdAt: advance.createdAt
    };
  }

  private mapSalaryPayment(payment: SalaryPayment): SalaryPaymentResponseDto {
    return {
      id: payment.id,
      workerId: payment.worker.id,
      workerName: payment.worker.name,
      paymentDate: payment.paymentDate as unknown as Date,
      weekNumber: payment.weekNumber,
      grossAmount: Number(payment.grossAmount),
      advanceDeducted: Number(payment.advanceDeducted),
      netAmount: Number(payment.netAmount),
      notes: payment.notes,
      createdAt: payment.createdAt
    };
  }
}
