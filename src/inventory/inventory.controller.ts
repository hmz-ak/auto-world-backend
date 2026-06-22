import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventorySummaryResponseDto } from './dto/inventory-summary-response.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({ status: 200, type: InventorySummaryResponseDto, description: 'Summary returned' })
  summary(): Promise<InventorySummaryResponseDto> {
    return this.inventoryService.summary();
  }

  @Get()
  @ApiOperation({ summary: 'List inventory items' })
  @ApiResponse({ status: 200, type: InventoryItemResponseDto, isArray: true, description: 'Inventory listed' })
  findAll(@Query() query: InventoryQueryDto): Promise<PaginatedResult<InventoryItemResponseDto>> {
    return this.inventoryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, type: InventoryItemResponseDto, description: 'Inventory item returned' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemResponseDto> {
    return this.inventoryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory item' })
  @ApiResponse({ status: 201, type: InventoryItemResponseDto, description: 'Inventory item created' })
  create(@Body() dto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    return this.inventoryService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, type: InventoryItemResponseDto, description: 'Inventory item updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiResponse({ status: 200, type: DeleteResponseDto, description: 'Inventory item deleted' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResponseDto> {
    return this.inventoryService.remove(id);
  }
}
