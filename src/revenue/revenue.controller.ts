import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { CreateRevenueEntryDto } from './dto/create-revenue-entry.dto';
import { RevenueEntryResponseDto } from './dto/revenue-entry-response.dto';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { RevenueSummaryResponseDto } from './dto/revenue-summary-response.dto';
import { UpdateRevenueEntryDto } from './dto/update-revenue-entry.dto';
import { RevenueService } from './revenue.service';

@ApiTags('revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get revenue summary' })
  @ApiResponse({ status: 200, description: 'Summary returned', type: RevenueSummaryResponseDto })
  summary(@Query() query: RevenueQueryDto): Promise<RevenueSummaryResponseDto> {
    return this.revenueService.summary(query);
  }

  @Get()
  @ApiOperation({ summary: 'List revenue entries' })
  @ApiResponse({ status: 200, description: 'Revenue listed', type: RevenueEntryResponseDto, isArray: true })
  findAll(@Query() query: RevenueQueryDto): Promise<PaginatedResult<RevenueEntryResponseDto>> {
    return this.revenueService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get revenue entry by ID' })
  @ApiResponse({ status: 200, description: 'Revenue entry returned', type: RevenueEntryResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RevenueEntryResponseDto> {
    return this.revenueService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create revenue entry' })
  @ApiResponse({ status: 201, description: 'Revenue entry created', type: RevenueEntryResponseDto })
  create(@Body() dto: CreateRevenueEntryDto): Promise<RevenueEntryResponseDto> {
    return this.revenueService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update revenue entry' })
  @ApiResponse({ status: 200, description: 'Revenue entry updated', type: RevenueEntryResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRevenueEntryDto
  ): Promise<RevenueEntryResponseDto> {
    return this.revenueService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete revenue entry' })
  @ApiResponse({ status: 200, description: 'Revenue entry deleted', type: DeleteResponseDto })
  remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResponseDto> {
    return this.revenueService.remove(id);
  }
}
