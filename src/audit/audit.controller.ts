import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List production audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs listed', type: AuditLogResponseDto, isArray: true })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<AuditLogResponseDto>> {
    return this.auditService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log returned', type: AuditLogResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLogResponseDto> {
    return this.auditService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create production audit log' })
  @ApiResponse({ status: 201, description: 'Audit log created', type: AuditLogResponseDto })
  create(@Body() dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    return this.auditService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update audit log notes' })
  @ApiResponse({ status: 200, description: 'Audit log updated', type: AuditLogResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuditLogDto): Promise<AuditLogResponseDto> {
    return this.auditService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reject audit log deletion' })
  @ApiResponse({ status: 403, description: 'Audit logs cannot be deleted' })
  remove(@Param('id', ParseIntPipe) _id: number): never {
    return this.auditService.remove();
  }
}
