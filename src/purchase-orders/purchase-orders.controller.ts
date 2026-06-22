import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PurchaseOrderStatus } from './constants/purchase-order.constants';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiResponse({ status: 200, description: 'Purchase orders listed' })
  findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Purchase order returned' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created' })
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: PurchaseOrderStatus) {
    return this.purchaseOrdersService.updateStatus(id, status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order header' })
  @ApiResponse({ status: 200, description: 'Purchase order updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.cancel(id);
  }
}
