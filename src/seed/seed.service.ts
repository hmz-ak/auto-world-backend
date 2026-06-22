import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService
  ) {}

  async onModuleInit(): Promise<void> {
    const userCount = await this.usersService.count();
    if (userCount === 0) {
      await this.usersService.create({ username: 'admin', password: 'admin123' });
    }

    await this.clientsService.seedDefaultClients();
  }
}
