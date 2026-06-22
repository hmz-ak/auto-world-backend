import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { PurchaseOrderStatus } from './constants/purchase-order.constants';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import {
  PurchaseOrderListItemDto,
  PurchaseOrderResponseDto
} from './dto/purchase-order-response.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiResponse({ status: 200, description: 'Purchase orders listed', type: PurchaseOrderListItemDto, isArray: true })
  findAll(@Query() query: PurchaseOrderQueryDto): Promise<PaginatedResult<PurchaseOrderListItemDto>> {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Purchase order returned', type: PurchaseOrderResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created', type: PurchaseOrderResponseDto })
  create(@Body() dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiResponse({ status: 200, description: 'Status updated', type: PurchaseOrderResponseDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PurchaseOrderStatus
  ): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.updateStatus(id, status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order header' })
  @ApiResponse({ status: 200, description: 'Purchase order updated', type: PurchaseOrderResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled', type: PurchaseOrderResponseDto })
  cancel(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.cancel(id);
  }
}
