import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdvancePayment } from './entities/advance-payment.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Worker } from './entities/worker.entity';
import { WorkersService } from './workers.service';

type MockRepository = Record<string, jest.Mock>;

function createRepositoryMock(): MockRepository {
  return {
    create: jest.fn((data) => data),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve({ id: entity.id ?? 1, createdAt: new Date('2026-06-20'), ...entity }))
  };
}

function createWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: 1,
    name: 'Ali',
    cnic: null,
    phone: null,
    role: 'Roller',
    monthlySalary: 20000,
    weeklySalary: 5000,
    pendingAdvance: 0,
    joiningDate: '2026-01-01',
    isActive: true,
    advances: [],
    salaryPayments: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides
  };
}

describe('WorkersService', () => {
  let service: WorkersService;
  let dataSource: { transaction: jest.Mock };
  let workersRepository: MockRepository;
  let advancesRepository: MockRepository;
  let manager: { create: jest.Mock; save: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    workersRepository = createRepositoryMock();
    advancesRepository = createRepositoryMock();
    dataSource = { transaction: jest.fn() };
    manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn((entity) =>
        Promise.resolve({
          id: 100,
          createdAt: new Date('2026-06-20'),
          ...entity
        })
      ),
      update: jest.fn(() => Promise.resolve({ affected: 1 }))
    };
    dataSource.transaction.mockImplementation((callback) => callback(manager));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Worker), useValue: workersRepository },
        { provide: getRepositoryToken(AdvancePayment), useValue: advancesRepository },
        { provide: getRepositoryToken(SalaryPayment), useValue: createRepositoryMock() }
      ]
    }).compile();

    service = module.get(WorkersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setSystemDate(date: Date): void {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  describe('processSaturdayPayments', () => {
    it('should throw BadRequestException if today is not Saturday and force is false', async () => {
      setSystemDate(new Date(2026, 5, 22, 12));
      workersRepository.find.mockResolvedValue([createWorker()]);

      await expect(service.processSaturdayPayments({ force: false })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should process payment on Saturday without forcing', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker()]);

      const result = await service.processSaturdayPayments({ force: false });

      expect(result.processed).toBe(1);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should set netAmount equal to weeklySalary when pendingAdvance is zero', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ pendingAdvance: 0 })]);

      const result = await service.processSaturdayPayments({ force: false });

      expect(result.payments[0].grossAmount).toBe(5000);
      expect(result.payments[0].advanceDeducted).toBe(0);
      expect(result.payments[0].netAmount).toBe(5000);
    });

    it('should deduct full advance when advance is less than weeklySalary', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ pendingAdvance: 2000 })]);

      const result = await service.processSaturdayPayments({ force: false });

      expect(result.payments[0].advanceDeducted).toBe(2000);
      expect(result.payments[0].netAmount).toBe(3000);
    });

    it('should cap deduction at weeklySalary when advance is greater than weeklySalary', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ pendingAdvance: 8000 })]);

      const result = await service.processSaturdayPayments({ force: false });

      expect(result.payments[0].advanceDeducted).toBe(5000);
      expect(result.payments[0].netAmount).toBe(0);
    });

    it('should reset worker pendingAdvance to zero after full deduction', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ id: 7, pendingAdvance: 2000 })]);

      await service.processSaturdayPayments({ force: false });

      expect(manager.update).toHaveBeenCalledWith(Worker, 7, { pendingAdvance: 0 });
    });

    it('should set worker pendingAdvance to remainder when advance is greater than weeklySalary', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ id: 8, pendingAdvance: 8000 })]);

      await service.processSaturdayPayments({ force: false });

      expect(manager.update).toHaveBeenCalledWith(Worker, 8, { pendingAdvance: 3000 });
    });

    it('should mark all advance payments for the worker as deducted', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([createWorker({ id: 9, pendingAdvance: 1000 })]);

      await service.processSaturdayPayments({ force: false });

      expect(manager.update).toHaveBeenCalledWith(
        AdvancePayment,
        { worker: { id: 9 }, isDeducted: false },
        { isDeducted: true }
      );
    });

    it('should return correct SalaryProcessResultDto totals', async () => {
      setSystemDate(new Date(2026, 5, 20, 12));
      workersRepository.find.mockResolvedValue([
        createWorker({ id: 1, name: 'Ali', pendingAdvance: 2000 }),
        createWorker({ id: 2, name: 'Bilal', pendingAdvance: 8000 })
      ]);

      const result = await service.processSaturdayPayments({ force: false });

      expect(result).toMatchObject({
        processed: 2,
        totalGrossPaid: 10000,
        totalAdvanceDeducted: 7000,
        totalNetPaid: 3000
      });
      expect(result.payments).toHaveLength(2);
    });
  });

  describe('recordAdvance', () => {
    it('should increase worker.pendingAdvance by the advance amount', async () => {
      const worker = createWorker({ pendingAdvance: 1000 });
      workersRepository.findOne.mockResolvedValue(worker);
      advancesRepository.save.mockImplementation((advance) =>
        Promise.resolve({ id: 11, createdAt: new Date('2026-06-20'), ...advance })
      );

      const result = await service.recordAdvance(worker.id, {
        amount: 1500,
        reason: 'Peshgi',
        takenOn: '2026-06-20'
      });

      expect(workersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ pendingAdvance: 2500 }));
      expect(result.amount).toBe(1500);
      expect(result.workerName).toBe(worker.name);
    });

    it('should throw NotFoundException if worker does not exist', async () => {
      workersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordAdvance(404, { amount: 1000, reason: null, takenOn: '2026-06-20' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException if amount is less than or equal to zero', async () => {
      await expect(
        service.recordAdvance(1, { amount: 0, reason: null, takenOn: '2026-06-20' })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if worker is inactive', async () => {
      workersRepository.findOne.mockResolvedValue(createWorker({ isActive: false }));

      await expect(
        service.recordAdvance(1, { amount: 1000, reason: null, takenOn: '2026-06-20' })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
