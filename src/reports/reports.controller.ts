import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { MonthlySeriesItemDto } from './dto/monthly-series-item.dto';
import { ProfitReportResponseDto } from './dto/profit-report-response.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('profit')
  @ApiOperation({ summary: 'Get profit report' })
  @ApiResponse({ status: 200, description: 'Profit report returned', type: ProfitReportResponseDto })
  profit(@Query() query: ReportQueryDto): Promise<ProfitReportResponseDto> {
    return this.reportsService.profit(query);
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary returned', type: DashboardSummaryResponseDto })
  dashboardSummary(): Promise<DashboardSummaryResponseDto> {
    return this.reportsService.dashboardSummary();
  }

  @Get('monthly-series')
  @ApiOperation({ summary: 'Get monthly revenue and expenses series' })
  @ApiResponse({ status: 200, description: 'Monthly series returned', type: MonthlySeriesItemDto, isArray: true })
  monthlySeries(@Query() query: ReportQueryDto): Promise<MonthlySeriesItemDto[]> {
    return this.reportsService.monthlySeries(query);
  }
}
