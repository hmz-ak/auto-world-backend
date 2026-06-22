import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AdvancePaymentResponseDto } from './dto/advance-payment-response.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { SalaryPaymentResponseDto } from './dto/salary-payment-response.dto';
import { SalaryPreviewResponseDto } from './dto/salary-preview-response.dto';
import { SalaryProcessResultDto } from './dto/salary-process-result.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerResponseDto } from './dto/worker-response.dto';
import { WorkersService } from './workers.service';

@ApiTags('workers')
@ApiBearerAuth()
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get('salary-preview')
  @ApiOperation({ summary: 'Preview active worker salary payments' })
  @ApiResponse({ status: 200, description: 'Salary preview returned', type: SalaryPreviewResponseDto })
  salaryPreview(): Promise<SalaryPreviewResponseDto> {
    return this.workersService.getSalaryPreview();
  }

  @Post('process-saturday')
  @ApiOperation({ summary: 'Process Saturday salary payment for all active workers' })
  @ApiResponse({ status: 201, description: 'Salary payments processed', type: SalaryProcessResultDto })
  processSaturday(@Body() dto: ProcessSalaryDto): Promise<SalaryProcessResultDto> {
    return this.workersService.processAllSalaries(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active workers' })
  @ApiResponse({ status: 200, description: 'Workers listed', type: WorkerResponseDto, isArray: true })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<WorkerResponseDto>> {
    return this.workersService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker with history' })
  @ApiResponse({ status: 200, description: 'Worker returned', type: WorkerResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkerResponseDto> {
    return this.workersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create worker' })
  @ApiResponse({ status: 201, description: 'Worker created', type: WorkerResponseDto })
  create(@Body() dto: CreateWorkerDto): Promise<WorkerResponseDto> {
    return this.workersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worker' })
  @ApiResponse({ status: 200, description: 'Worker updated', type: WorkerResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkerDto): Promise<WorkerResponseDto> {
    return this.workersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate worker' })
  @ApiResponse({ status: 200, description: 'Worker deactivated', type: WorkerResponseDto })
  remove(@Param('id', ParseIntPipe) id: number): Promise<WorkerResponseDto> {
    return this.workersService.softDelete(id);
  }

  @Post(':id/advance')
  @ApiOperation({ summary: 'Record worker advance' })
  @ApiResponse({ status: 201, description: 'Advance recorded', type: AdvancePaymentResponseDto })
  recordAdvance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAdvanceDto
  ): Promise<AdvancePaymentResponseDto> {
    return this.workersService.recordAdvance(id, dto);
  }

  @Get(':id/advances')
  @ApiOperation({ summary: 'List worker advances' })
  @ApiResponse({ status: 200, description: 'Advances listed', type: AdvancePaymentResponseDto, isArray: true })
  listAdvances(@Param('id', ParseIntPipe) id: number): Promise<AdvancePaymentResponseDto[]> {
    return this.workersService.listAdvances(id);
  }

  @Get(':id/salary-history')
  @ApiOperation({ summary: 'List worker salary history' })
  @ApiResponse({ status: 200, description: 'Salary history listed', type: SalaryPaymentResponseDto, isArray: true })
  salaryHistory(@Param('id', ParseIntPipe) id: number): Promise<SalaryPaymentResponseDto[]> {
    return this.workersService.listSalaryHistory(id);
  }

  @Post(':id/pay-salary')
  @ApiOperation({ summary: 'Process salary for one worker' })
  @ApiResponse({ status: 201, description: 'Salary processed', type: SalaryProcessResultDto })
  paySalary(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessSalaryDto
  ): Promise<SalaryProcessResultDto> {
    return this.workersService.processWorkerSalary(id, dto);
  }
}
