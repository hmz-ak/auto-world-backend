import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseSummaryResponseDto } from './dto/expense-summary-response.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get expense summary' })
  @ApiResponse({ status: 200, description: 'Summary returned', type: ExpenseSummaryResponseDto })
  summary(@Query() query: ExpenseQueryDto): Promise<ExpenseSummaryResponseDto> {
    return this.expensesService.summary(query);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  @ApiResponse({ status: 200, description: 'Expenses listed', type: ExpenseResponseDto, isArray: true })
  findAll(@Query() query: ExpenseQueryDto): Promise<PaginatedResult<ExpenseResponseDto>> {
    return this.expensesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense returned', type: ExpenseResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  @ApiResponse({ status: 201, description: 'Expense created', type: ExpenseResponseDto })
  create(@Body() dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: 200, description: 'Expense updated', type: ExpenseResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted', type: DeleteResponseDto })
  remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResponseDto> {
    return this.expensesService.remove(id);
  }
}
