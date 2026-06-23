import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { CreateManufacturingRecordDto } from './dto/create-manufacturing-record.dto';

@ApiTags('manufacturing')
@ApiBearerAuth()
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List manufacturing records' })
  @ApiResponse({ status: 200, description: 'Manufacturing records listed', type: AuditLogResponseDto, isArray: true })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<AuditLogResponseDto>> {
    return this.auditService.findManufacturingAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manufacturing record by ID' })
  @ApiResponse({ status: 200, description: 'Manufacturing record returned', type: AuditLogResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLogResponseDto> {
    return this.auditService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create manufacturing record and consume raw material' })
  @ApiResponse({ status: 201, description: 'Manufacturing record created', type: AuditLogResponseDto })
  create(@Body() dto: CreateManufacturingRecordDto): Promise<AuditLogResponseDto> {
    return this.auditService.createManufacturingRecord(dto);
  }
}
