import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ClientsService } from './clients.service';
import { ClientResponseDto } from './dto/client-response.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients' })
  @ApiResponse({ status: 200, type: ClientResponseDto, isArray: true, description: 'Clients listed' })
  findAll(@Query() query: ClientQueryDto): Promise<PaginatedResult<ClientResponseDto>> {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, type: ClientResponseDto, description: 'Client found' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ClientResponseDto> {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create client' })
  @ApiResponse({ status: 201, type: ClientResponseDto, description: 'Client created' })
  create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({ status: 200, type: ClientResponseDto, description: 'Client updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClientDto): Promise<ClientResponseDto> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete client' })
  @ApiResponse({ status: 200, type: ClientResponseDto, description: 'Client deactivated' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<ClientResponseDto> {
    return this.clientsService.softDelete(id);
  }
}
