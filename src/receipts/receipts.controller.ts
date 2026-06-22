import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptPrintResponseDto } from './dto/receipt-print-response.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';
import { ReceiptListItemDto, ReceiptResponseDto } from './dto/receipt-response.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'List receipts' })
  @ApiResponse({ status: 200, description: 'Receipts listed', type: ReceiptListItemDto, isArray: true })
  findAll(@Query() query: ReceiptQueryDto): Promise<PaginatedResult<ReceiptListItemDto>> {
    return this.receiptsService.findAll(query);
  }

  @Get(':id/print')
  @ApiOperation({ summary: 'Get print-ready receipt data' })
  @ApiResponse({ status: 200, description: 'Print data returned', type: ReceiptPrintResponseDto })
  print(@Param('id', ParseIntPipe) id: number): Promise<ReceiptPrintResponseDto> {
    return this.receiptsService.print(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: 200, description: 'Receipt returned', type: ReceiptResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ReceiptResponseDto> {
    return this.receiptsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create receipt' })
  @ApiResponse({ status: 201, description: 'Receipt created', type: ReceiptResponseDto })
  create(@Body() dto: CreateReceiptDto): Promise<ReceiptResponseDto> {
    return this.receiptsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update receipt' })
  @ApiResponse({ status: 200, description: 'Receipt updated', type: ReceiptResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceiptDto): Promise<ReceiptResponseDto> {
    return this.receiptsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt' })
  @ApiResponse({ status: 200, description: 'Receipt deleted', type: DeleteResponseDto })
  remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResponseDto> {
    return this.receiptsService.remove(id);
  }
}
