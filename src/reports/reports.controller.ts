import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit')
  @ApiOperation({ summary: 'Get profit report' })
  @ApiResponse({ status: 200, description: 'Profit report returned' })
  profit(@Query() query: ReportQueryDto) {
    return this.reportsService.profit(query);
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary returned' })
  dashboardSummary() {
    return this.reportsService.dashboardSummary();
  }

  @Get('monthly-series')
  @ApiOperation({ summary: 'Get monthly revenue and expenses series' })
  @ApiResponse({ status: 200, description: 'Monthly series returned' })
  monthlySeries(@Query() query: ReportQueryDto) {
    return this.reportsService.monthlySeries(query);
  }
}
