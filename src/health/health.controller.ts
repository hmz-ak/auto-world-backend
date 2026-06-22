import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Check API health' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHealth() {
    return {
      status: 'ok',
      app: 'Auto World API'
    };
  }
}
