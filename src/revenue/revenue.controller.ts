import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRevenueEntryDto } from './dto/create-revenue-entry.dto';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { UpdateRevenueEntryDto } from './dto/update-revenue-entry.dto';
import { RevenueService } from './revenue.service';

@ApiTags('revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get revenue summary' })
  @ApiResponse({ status: 200, description: 'Summary returned' })
  summary(@Query() query: RevenueQueryDto) {
    return this.revenueService.summary(query);
  }

  @Get()
  @ApiOperation({ summary: 'List revenue entries' })
  @ApiResponse({ status: 200, description: 'Revenue listed' })
  findAll(@Query() query: RevenueQueryDto) {
    return this.revenueService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get revenue entry by ID' })
  @ApiResponse({ status: 200, description: 'Revenue entry returned' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.revenueService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create revenue entry' })
  @ApiResponse({ status: 201, description: 'Revenue entry created' })
  create(@Body() dto: CreateRevenueEntryDto) {
    return this.revenueService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update revenue entry' })
  @ApiResponse({ status: 200, description: 'Revenue entry updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRevenueEntryDto) {
    return this.revenueService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete revenue entry' })
  @ApiResponse({ status: 200, description: 'Revenue entry deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.revenueService.remove(id);
  }
}
