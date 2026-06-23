import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { CreateManufacturingProcessSheetDto } from './dto/create-manufacturing-process-sheet.dto';
import { CreateManufacturingRecordDto } from './dto/create-manufacturing-record.dto';
import { ManufacturingProcessSheetResponseDto } from './dto/manufacturing-process-sheet-response.dto';
import { UpdateManufacturingProcessStepDto } from './dto/update-manufacturing-process-step.dto';

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

  @Post()
  @ApiOperation({ summary: 'Create manufacturing record and consume raw material' })
  @ApiResponse({ status: 201, description: 'Manufacturing record created', type: AuditLogResponseDto })
  create(@Body() dto: CreateManufacturingRecordDto): Promise<AuditLogResponseDto> {
    return this.auditService.createManufacturingRecord(dto);
  }

  @Get(':id/process-sheets')
  @ApiOperation({ summary: 'List process sheets for a manufacturing record' })
  @ApiResponse({ status: 200, description: 'Process sheets listed', type: ManufacturingProcessSheetResponseDto, isArray: true })
  findProcessSheets(@Param('id', ParseIntPipe) id: number): Promise<ManufacturingProcessSheetResponseDto[]> {
    return this.auditService.findManufacturingProcessSheets(id);
  }

  @Post(':id/process-sheets')
  @ApiOperation({ summary: 'Create a process sheet for a manufacturing record chunk' })
  @ApiResponse({ status: 201, description: 'Process sheet created', type: ManufacturingProcessSheetResponseDto })
  createProcessSheet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateManufacturingProcessSheetDto
  ): Promise<ManufacturingProcessSheetResponseDto> {
    return this.auditService.createManufacturingProcessSheet(id, dto);
  }

  @Get('process-sheets/:sheetId')
  @ApiOperation({ summary: 'Get manufacturing process sheet by ID' })
  @ApiResponse({ status: 200, description: 'Process sheet returned', type: ManufacturingProcessSheetResponseDto })
  findProcessSheet(@Param('sheetId', ParseIntPipe) sheetId: number): Promise<ManufacturingProcessSheetResponseDto> {
    return this.auditService.findManufacturingProcessSheet(sheetId);
  }

  @Post('process-sheets/:sheetId/process-step')
  @ApiOperation({ summary: 'Update one process sheet phase' })
  @ApiResponse({ status: 200, description: 'Process sheet phase updated', type: ManufacturingProcessSheetResponseDto })
  updateProcessSheetStep(
    @Param('sheetId', ParseIntPipe) sheetId: number,
    @Body() dto: UpdateManufacturingProcessStepDto
  ): Promise<ManufacturingProcessSheetResponseDto> {
    return this.auditService.updateManufacturingProcessSheetStep(sheetId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manufacturing record by ID' })
  @ApiResponse({ status: 200, description: 'Manufacturing record returned', type: AuditLogResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLogResponseDto> {
    return this.auditService.findOne(id);
  }

  @Post(':id/process-step')
  @ApiOperation({ summary: 'Update one manufacturing process sheet phase' })
  @ApiResponse({ status: 200, description: 'Manufacturing process phase updated', type: AuditLogResponseDto })
  updateProcessStep(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManufacturingProcessStepDto
  ): Promise<AuditLogResponseDto> {
    return this.auditService.updateManufacturingProcessStep(id, dto);
  }
}
