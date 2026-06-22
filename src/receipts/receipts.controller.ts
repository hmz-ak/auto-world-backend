import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'List receipts' })
  @ApiResponse({ status: 200, description: 'Receipts listed' })
  findAll(@Query() query: ReceiptQueryDto) {
    return this.receiptsService.findAll(query);
  }

  @Get(':id/print')
  @ApiOperation({ summary: 'Get print-ready receipt data' })
  @ApiResponse({ status: 200, description: 'Print data returned' })
  print(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.print(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: 200, description: 'Receipt returned' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create receipt' })
  @ApiResponse({ status: 201, description: 'Receipt created' })
  create(@Body() dto: CreateReceiptDto) {
    return this.receiptsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update receipt' })
  @ApiResponse({ status: 200, description: 'Receipt updated' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceiptDto) {
    return this.receiptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt' })
  @ApiResponse({ status: 200, description: 'Receipt deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.remove(id);
  }
}
