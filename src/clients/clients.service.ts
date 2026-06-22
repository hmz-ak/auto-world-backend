import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { ClientResponseDto } from './dto/client-response.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>
  ) {}

  async findAll(query: ClientQueryDto): Promise<PaginatedResult<ClientResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.clientsRepository
      .createQueryBuilder('client')
      .orderBy('client.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (typeof query.isActive === 'boolean') {
      builder.where('client.isActive = :isActive', { isActive: query.isActive });
    }

    const [clients, total] = await builder.getManyAndCount();
    return buildPaginatedResult(clients.map((client) => this.mapClient(client)), total, page, limit);
  }

  async findOne(id: number): Promise<ClientResponseDto> {
    const client = await this.findEntityById(id);
    return this.mapClient(client);
  }

  async findEntityById(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async create(dto: CreateClientDto): Promise<ClientResponseDto> {
    const existing = await this.clientsRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Client name already exists');
    }
    const client = await this.clientsRepository.save(this.clientsRepository.create(dto));
    return this.mapClient(client);
  }

  async update(id: number, dto: UpdateClientDto): Promise<ClientResponseDto> {
    const client = await this.findEntityById(id);
    Object.assign(client, dto);
    return this.mapClient(await this.clientsRepository.save(client));
  }

  async softDelete(id: number): Promise<ClientResponseDto> {
    const client = await this.findEntityById(id);
    client.isActive = false;
    return this.mapClient(await this.clientsRepository.save(client));
  }

  async seedDefaultClients(): Promise<void> {
    await this.createIfMissing('New Asia');
    await this.createIfMissing('Pak Star');
  }

  private async createIfMissing(name: string): Promise<void> {
    const existing = await this.clientsRepository.findOne({ where: { name } });
    if (!existing) {
      await this.clientsRepository.save(this.clientsRepository.create({ name, isActive: true }));
    }
  }

  mapClient(client: Client): ClientResponseDto {
    return {
      id: client.id,
      name: client.name,
      contactPerson: client.contactPerson,
      phone: client.phone,
      address: client.address,
      isActive: client.isActive,
      createdAt: client.createdAt
    };
  }
}
