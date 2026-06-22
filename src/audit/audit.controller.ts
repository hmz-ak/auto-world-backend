import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List production audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs listed' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.auditService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log returned' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create production audit log' })
  @ApiResponse({ status: 201, description: 'Audit log created' })
  create(@Body() dto: CreateAuditLogDto) {
    return this.auditService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update audit log notes' })
  @ApiResponse({ status: 200, description: 'Audit log updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuditLogDto) {
    return this.auditService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Reject audit log deletion' })
  @ApiResponse({ status: 403, description: 'Audit logs cannot be deleted' })
  remove() {
    return this.auditService.remove();
  }
}
