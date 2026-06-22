import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { UsersModule } from '../users/users.module';
import { SeedService } from './seed.service';

@Module({
  imports: [ClientsModule, UsersModule],
  providers: [SeedService]
})
export class SeedModule {}
