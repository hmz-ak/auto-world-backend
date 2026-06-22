import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkersService } from './workers.service';

@ApiTags('workers')
@ApiBearerAuth()
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get('salary-preview')
  @ApiOperation({ summary: 'Preview active worker salary payments' })
  @ApiResponse({ status: 200, description: 'Salary preview returned' })
  salaryPreview() {
    return this.workersService.getSalaryPreview();
  }

  @Post('process-saturday')
  @ApiOperation({ summary: 'Process Saturday salary payment for all active workers' })
  @ApiResponse({ status: 201, description: 'Salary payments processed' })
  processSaturday(@Body() dto: ProcessSalaryDto) {
    return this.workersService.processAllSalaries(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active workers' })
  @ApiResponse({ status: 200, description: 'Workers listed' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.workersService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker with history' })
  @ApiResponse({ status: 200, description: 'Worker returned' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create worker' })
  @ApiResponse({ status: 201, description: 'Worker created' })
  create(@Body() dto: CreateWorkerDto) {
    return this.workersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update worker' })
  @ApiResponse({ status: 200, description: 'Worker updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate worker' })
  @ApiResponse({ status: 200, description: 'Worker deactivated' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.softDelete(id);
  }

  @Post(':id/advance')
  @ApiOperation({ summary: 'Record worker advance' })
  @ApiResponse({ status: 201, description: 'Advance recorded' })
  recordAdvance(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAdvanceDto) {
    return this.workersService.recordAdvance(id, dto);
  }

  @Get(':id/advances')
  @ApiOperation({ summary: 'List worker advances' })
  @ApiResponse({ status: 200, description: 'Advances listed' })
  listAdvances(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.listAdvances(id);
  }

  @Get(':id/salary-history')
  @ApiOperation({ summary: 'List worker salary history' })
  @ApiResponse({ status: 200, description: 'Salary history listed' })
  salaryHistory(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.listSalaryHistory(id);
  }

  @Post(':id/pay-salary')
  @ApiOperation({ summary: 'Process salary for one worker' })
  @ApiResponse({ status: 201, description: 'Salary processed' })
  paySalary(@Param('id', ParseIntPipe) id: number, @Body() dto: ProcessSalaryDto) {
    return this.workersService.processWorkerSalary(id, dto);
  }
}
