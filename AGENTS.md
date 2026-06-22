# AGENTS.md — Backend Coding Standard & Guidelines
# Every line of code written or modified must follow this standard.
# No exceptions, no shortcuts, not even for small fixes.

## PROJECT STACK
- NestJS (TypeScript, latest stable)
- TypeORM
- PostgreSQL
- JWT Authentication (passport-jwt)
- class-validator + class-transformer (DTO validation)
- @nestjs/swagger (API documentation)
- @nestjs/config (environment variables)

---

## 1. FILE & FOLDER STRUCTURE

Follow a feature-first, module-per-domain structure. Every feature is
self-contained inside its own NestJS module. Shared utilities and
abstractions live in the common/ folder. Nothing leaks across modules
unless it is explicitly exported from that module.

```
src/
├── main.ts                         # App bootstrap only — no logic here
├── app.module.ts                   # Root module — imports feature modules only
│
├── auth/                           # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── auth-response.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── inventory/                      # Example feature module (all modules follow this)
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   ├── entities/
│   │   └── inventory-item.entity.ts
│   ├── dto/
│   │   ├── create-inventory-item.dto.ts
│   │   └── update-inventory-item.dto.ts
│   └── constants/
│       └── inventory.constants.ts
│
├── workers/
├── purchase-orders/
├── receipts/
├── expenses/
├── revenue/
├── audit/
│
└── common/                         # Shared utilities, not a NestJS module
    ├── decorators/                 # Custom param/method decorators
    ├── filters/                    # Global exception filters
    ├── guards/                     # Shared guards (roles, etc.)
    ├── interceptors/               # Response transform, logging interceptors
    ├── pipes/                      # Custom validation/transform pipes
    ├── utils/                      # Pure helper functions
    │   ├── date.util.ts
    │   └── response.util.ts
    ├── constants/
    │   └── app.constants.ts        # App-wide enums, statuses, roles
    └── interfaces/
        └── paginated-result.interface.ts
```

Rules:
- Every feature is a self-contained NestJS module. Controllers, services,
  entities, and DTOs for a feature live inside that feature's folder only.
- Modules must NOT import services or repositories from other modules
  directly. If sharing is needed, export the service from its module and
  import that module.
- The common/ folder is NOT a NestJS module — it holds pure utilities,
  interfaces, and decorators that any module can import directly.
- No business logic in controllers. Controllers only receive requests,
  call the service, and return the response.
- No database queries in controllers. All database access goes through
  the service layer via TypeORM repositories.
- One entity per file. One DTO per file. One file per responsibility.

---

## 2. NESTJS MODULE STANDARDS

### Modules
- Every feature has exactly one module file (feature.module.ts).
- The module imports TypeOrmModule.forFeature([Entity]) to register its
  own entities. It never registers entities that belong to another module.
- If a feature needs something from another feature, import the other
  module — never reach across and import the service directly.
- AppModule only imports feature modules and global config. It contains
  no providers or controllers of its own.

```typescript
// ✅ Correct — feature module importing another module
@Module({
  imports: [TypeOrmModule.forFeature([Worker]), SalariesModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}

// ❌ Wrong — reaching into another module's service directly
@Module({
  providers: [WorkersService, SalariesService], // SalariesService doesn't belong here
})
```

### Controllers
- Controllers are thin. Their only job: receive HTTP request, call
  service method, return result.
- Every controller method must have a Swagger decorator:
  @ApiOperation, @ApiResponse, @ApiBearerAuth.
- Route paths use kebab-case: /purchase-orders, not /purchaseOrders.
- Always use explicit HTTP method decorators: @Get(), @Post(),
  @Patch(), @Delete(). Never use @Put() for partial updates — use @Patch().
- Use @Param('id') for route params, @Query() for query strings,
  @Body() for request body. Never access req.params or req.body manually.

```typescript
// ✅ Correct controller method
@Get(':id')
@ApiOperation({ summary: 'Get a single inventory item by ID' })
@ApiResponse({ status: 200, type: InventoryItemResponseDto })
@ApiResponse({ status: 404, description: 'Item not found' })
findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemResponseDto> {
  return this.inventoryService.findOne(id);
}

// ❌ Wrong — logic inside controller
@Get(':id')
async findOne(@Param('id') id: string, @Req() req: Request) {
  const item = await this.repo.findOne({ where: { id: Number(id) } });
  if (!item) throw new NotFoundException();
  return item;
}
```

### Services
- Services hold ALL business logic. If a rule, calculation, or decision
  is being made — it happens in the service.
- Services interact with the database via TypeORM repositories only.
  Never import and use the raw DataSource or EntityManager unless there
  is no alternative (e.g. complex transactions).
- Services must be stateless. Never store request-specific data as class
  properties.
- If a method is doing more than one thing, split it into private helpers.
- Every service method must be async and return a typed Promise.

```typescript
// ✅ Correct — service handles all logic
async findOne(id: number): Promise<InventoryItem> {
  const item = await this.inventoryRepo.findOne({ where: { id } });
  if (!item) {
    throw new NotFoundException(`Inventory item with ID ${id} not found`);
  }
  return item;
}

// ❌ Wrong — returning raw DB objects without guard
async findOne(id: number) {
  return this.inventoryRepo.findOne({ where: { id } }); // may return null
}
```

---

## 3. TYPEORM & DATABASE STANDARDS

### Entities
- Every entity lives in its feature module's entities/ folder.
- Every entity extends a shared BaseEntity or uses embedded columns for
  createdAt and updatedAt. Always use @CreateDateColumn and
  @UpdateDateColumn — never set these manually.
- Primary keys are always auto-incremented integers using @PrimaryGeneratedColumn().
- Every column must have an explicit type and options. Never rely on
  TypeORM to infer the column type.
- Use @Column({ nullable: false }) by default. Only allow null when the
  field is genuinely optional in the business domain.
- All financial/monetary values are stored as DECIMAL, not FLOAT.
  Floating-point arithmetic is not suitable for money.
- Use enums for fixed-value columns (status, type, category). Define
  the enum in the feature's constants file, not inline in the entity.

```typescript
// ✅ Correct entity
import { InventoryStatus } from '../constants/inventory.constants';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  quantity: number;

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.AVAILABLE })
  status: InventoryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ❌ Wrong entity
@Entity()
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()           // no type, no length, no nullable
  name: string;

  @Column()           // float for money — wrong
  price: number;
}
```

### Repositories
- Always inject the TypeORM repository using @InjectRepository(Entity).
- Never use the global getRepository() function — it is deprecated.
- For simple queries, use the repository methods (findOne, find, save,
  update, delete).
- For complex queries with joins or conditions, use QueryBuilder.
  Always alias your tables for clarity.
- Always select only the columns you need. Never use SELECT * in
  QueryBuilder when specific fields suffice.

```typescript
// ✅ Correct — QueryBuilder with explicit alias and selected columns
async findAllAvailable(): Promise<InventoryItem[]> {
  return this.inventoryRepo
    .createQueryBuilder('item')
    .where('item.status = :status', { status: InventoryStatus.AVAILABLE })
    .select(['item.id', 'item.name', 'item.quantity'])
    .getMany();
}
```

### Migrations
- In production, NEVER use synchronize: true. It is only allowed in
  development with a local database.
- All schema changes must be done via TypeORM migrations.
- Migration files are generated with:
  `npm run migration:generate -- src/migrations/MigrationName`
- Never edit a migration file that has already been run in production.
  Create a new migration instead.
- Every migration must be reversible — implement both up() and down().

---

## 4. DTO STANDARDS

DTOs (Data Transfer Objects) define the shape of incoming requests and
outgoing responses. Every API input and output must have a DTO.

### Input DTOs (Request)
- Every input DTO uses class-validator decorators for validation.
- Every property in an input DTO must have at least one validator.
- Use @IsString(), @IsNumber(), @IsEnum(), @IsOptional(), @IsDate(),
  @MinLength(), @MaxLength(), @Min(), @Max() — never let raw unvalidated
  data reach the service.
- Input DTOs use the @ApiProperty() decorator on every field for
  Swagger documentation.
- For update DTOs, use PartialType(CreateDto) from @nestjs/swagger.
  This makes all fields optional and keeps Swagger docs in sync.

```typescript
// ✅ Correct input DTO
export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Steel Flat Bar (Patti)', description: 'Name of the raw material' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantity: number;

  @ApiProperty({ enum: UnitOfMeasure })
  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;
}

// ❌ Wrong DTO — no validation, no Swagger docs
export class CreateInventoryItemDto {
  name: string;
  quantity: number;
  unit: string;
}
```

### Output DTOs (Response)
- Never return raw TypeORM entity objects from controllers. Always map
  to a response DTO to control exactly what data leaves the API.
- Sensitive fields (passwords, internal flags) must be excluded from
  response DTOs — never expose them even by accident.
- Response DTOs also use @ApiProperty() for full Swagger documentation.

```typescript
// ✅ Correct — explicit response DTO
export class InventoryItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: InventoryStatus })
  status: InventoryStatus;

  @ApiProperty()
  createdAt: Date;
}

// ❌ Wrong — returning raw entity (exposes internals, no control)
return this.inventoryRepo.findOne({ where: { id } }); // returned directly from controller
```

---

## 5. VALIDATION STANDARDS

- Enable global validation pipe in main.ts with these options:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,         // strip properties not in the DTO
  forbidNonWhitelisted: true, // throw error if extra properties are sent
  transform: true,         // auto-transform payloads to DTO class instances
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```
- `whitelist: true` ensures that any property not declared in the DTO
  is silently stripped — no extra data reaches the service.
- `forbidNonWhitelisted: true` goes further and throws a 400 error
  if the client sends unknown properties.
- `transform: true` ensures @Param() and @Query() values are converted
  to their declared types (string '5' becomes number 5 automatically).
- Never skip validation for any endpoint, including internal ones.

---

## 6. ERROR HANDLING STANDARDS

### Exception Filters
- Use NestJS built-in HTTP exceptions for all expected error cases:
  - NotFoundException (404) — resource not found
  - BadRequestException (400) — invalid input the validator missed
  - UnauthorizedException (401) — not logged in
  - ForbiddenException (403) — logged in but not permitted
  - ConflictException (409) — duplicate resource
  - InternalServerErrorException (500) — unexpected server failure
- Never throw generic JavaScript Error() objects from services.
  Always throw a NestJS HttpException subclass.
- Create a global exception filter (common/filters/http-exception.filter.ts)
  that formats ALL error responses into a consistent shape:
```typescript
{
  "success": false,
  "statusCode": 404,
  "message": "Inventory item with ID 5 not found",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/inventory/5"
}
```
- Apply the global exception filter in main.ts using
  app.useGlobalFilters().
- Never expose raw database errors or stack traces to the client.
  Catch TypeORM errors in the service and rethrow as appropriate
  NestJS exceptions.

```typescript
// ✅ Correct error handling in service
async remove(id: number): Promise<void> {
  const item = await this.findOne(id); // findOne already throws NotFoundException
  try {
    await this.inventoryRepo.remove(item);
  } catch (error) {
    throw new InternalServerErrorException('Failed to delete inventory item');
  }
}

// ❌ Wrong — leaking DB errors to client
async remove(id: number) {
  await this.inventoryRepo.delete(id); // if it fails, raw DB error leaks out
}
```

---

## 7. RESPONSE FORMAT STANDARDS

All API responses must follow a consistent envelope format. Apply a
global response interceptor (common/interceptors/transform.interceptor.ts)
to wrap all successful responses automatically.

### Success Response (single item)
```json
{
  "success": true,
  "data": { "id": 1, "name": "Steel Flat Bar" }
}
```

### Success Response (list with pagination)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Pagination
- All list endpoints must support pagination. Never return an unbounded
  list from the database.
- Accept `page` (default: 1) and `limit` (default: 20, max: 100) as
  query parameters.
- Define a reusable PaginationQueryDto in common/dto/ and extend it in
  every list query DTO.
- Return a meta object alongside the data with total, page, limit,
  totalPages.

```typescript
// ✅ Correct — paginated query
async findAll(page: number, limit: number): Promise<PaginatedResult<InventoryItem>> {
  const [items, total] = await this.inventoryRepo.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ❌ Wrong — unbounded query
async findAll(): Promise<InventoryItem[]> {
  return this.inventoryRepo.find(); // returns everything in the table
}
```

---

## 8. AUTHENTICATION & SECURITY STANDARDS

### JWT Setup
- JWT secrets must come from environment variables only. Never hardcode
  a JWT secret anywhere in source code.
- Access tokens must have a short expiry (15 minutes to 1 hour).
- Apply JwtAuthGuard globally in AppModule so every endpoint is
  protected by default:
```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```
- Use a @Public() decorator on the few routes that don't need auth
  (login, health check). This is safer than opting-in to guards per route.

### Guards
- JwtAuthGuard: verifies the JWT token on every request.
- RolesGuard: checks the user's role against @Roles() decorators if
  role-based access is needed in the future.
- Apply guards at the controller or method level, never inside service
  methods. Security is the controller's responsibility.

### Input Security
- Never trust any data from the request. All inputs are validated by the
  global ValidationPipe before reaching the service.
- Passwords must always be hashed with bcrypt before saving. Never store
  plain-text passwords under any circumstances.
- Never log request bodies, passwords, tokens, or any PII to the console
  or logger.
- All query parameters that are used in database queries must go through
  TypeORM's parameterized queries. Never concatenate user input into a
  raw SQL string.

```typescript
// ✅ Safe — parameterized query
.where('worker.name = :name', { name: searchName })

// ❌ Dangerous — SQL injection risk
.where(`worker.name = '${searchName}'`)
```

### Environment & Secrets
- All secrets in .env. The .env file must be in .gitignore.
- Provide a .env.example with placeholder values and a comment for
  every variable.
- Never use process.env.VARIABLE directly in source files. Access all
  config through ConfigService from @nestjs/config.

```typescript
// ✅ Correct — using ConfigService
constructor(private readonly configService: ConfigService) {}

const secret = this.configService.get<string>('JWT_SECRET');

// ❌ Wrong — accessing env directly
const secret = process.env.JWT_SECRET;
```

### CORS
- Configure CORS in main.ts explicitly. Do not use the wildcard origin
  '*' unless it is a public API. Specify the allowed frontend origin.

---

## 9. CLEAN CODE STANDARDS

### General Rules
- Every function does ONE thing. If you need to write "and" in the
  function's description, split it into two functions.
- No function longer than 30 lines. If it is longer, extract helpers.
- No file longer than 200 lines where a logical split is reasonable.
- No commented-out code anywhere. It belongs in git history.
- No console.log or console.error anywhere in source code. Use the
  NestJS built-in Logger instead.
- No unused imports, variables, parameters, or methods anywhere.
- No any type in TypeScript. If the type is truly unknown, use unknown
  and narrow it before use.

```typescript
// ✅ Correct — typed service method
async createWorker(dto: CreateWorkerDto): Promise<WorkerResponseDto> { ... }

// ❌ Wrong — any kills type safety
async createWorker(dto: any): Promise<any> { ... }
```

### Readability
- Name things for what they mean, not what they are:
  ✅ const unpaidWorkers = workers.filter(w => !w.isPaid)
  ❌ const arr = workers.filter(w => !w.isPaid)
- Complex conditions must be extracted to named booleans:
  ✅ const isSaturday = dayOfWeek === 6
  ✅ const hasPendingAdvance = worker.advanceAmount > 0
  ✅ if (isSaturday && hasPendingAdvance) { ... }
  ❌ if (new Date().getDay() === 6 && worker.advanceAmount > 0) { ... }
- Use early returns to reduce nesting. Validate and reject early:
  ✅ if (!worker) throw new NotFoundException(...)
  ✅ if (amount <= 0) throw new BadRequestException(...)
  ❌ deeply nested if/else chains

### Async/Await
- Always use async/await. Never mix .then()/.catch() with async/await
  in the same function.
- Always await Promises. Never fire-and-forget unless it is intentional
  and clearly commented.
- Wrap all awaited calls that can fail in try/catch where you need to
  handle the error specifically, or let it bubble up to the global
  exception filter.

---

## 10. NAMING STANDARDS

| Type | Convention | Example |
|---|---|---|
| Module files | kebab-case | inventory.module.ts |
| Controller files | kebab-case | inventory.controller.ts |
| Service files | kebab-case | inventory.service.ts |
| Entity files | kebab-case | inventory-item.entity.ts |
| DTO files | kebab-case | create-inventory-item.dto.ts |
| Utility files | kebab-case | date.util.ts |
| Constant files | kebab-case | inventory.constants.ts |
| Interface files | kebab-case | paginated-result.interface.ts |
| Folders | kebab-case | purchase-orders/, common/ |
| Classes (all) | PascalCase | InventoryService, WorkerEntity |
| Methods & variables | camelCase | findAllWorkers, totalSalary |
| Constants / Enums values | UPPER_SNAKE_CASE | INVENTORY_STATUS.AVAILABLE |
| DB table names | snake_case plural | inventory_items, purchase_orders |
| DB column names | snake_case | created_at, worker_id |
| Route paths | kebab-case | /purchase-orders, /audit-logs |
| Boolean variables | is/has/can/should prefix | isPaid, hasAdvance, canDelete |

---

## 11. SWAGGER / API DOCUMENTATION STANDARDS

- Every controller must have @ApiTags('module-name') at the class level.
- Every controller method must have @ApiOperation({ summary: '...' }).
- Every controller method must have at least one @ApiResponse for the
  success case and one for the expected failure cases (404, 400, 401).
- Every DTO property must have @ApiProperty() with an example and
  description.
- Every protected endpoint must have @ApiBearerAuth().
- The Swagger setup in main.ts must include the app title, description,
  version, and bearer auth scheme definition.

```typescript
// ✅ Correct controller with full Swagger docs
@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {

  @Post()
  @ApiOperation({ summary: 'Add a new inventory item' })
  @ApiResponse({ status: 201, type: InventoryItemResponseDto, description: 'Item created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    return this.inventoryService.create(dto);
  }
}
```

---

## 12. LOGGING STANDARDS

- Use NestJS's built-in Logger class. Instantiate it per class:
  `private readonly logger = new Logger(InventoryService.name);`
- Log the following:
  - `logger.log()` — successful operations worth tracking (item created,
    salary paid, order received)
  - `logger.warn()` — unusual but non-fatal situations (advance deducted,
    low stock detected)
  - `logger.error()` — caught exceptions with context (what failed, what
    ID, what action was being taken)
- Never log passwords, JWT tokens, or any personal/sensitive data.
- Never use console.log anywhere. Use the Logger only.

```typescript
// ✅ Correct logging
async create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
  try {
    const item = this.inventoryRepo.create(dto);
    const saved = await this.inventoryRepo.save(item);
    this.logger.log(`Inventory item created: ID=${saved.id}, name=${saved.name}`);
    return saved;
  } catch (error) {
    this.logger.error(`Failed to create inventory item: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Could not create inventory item');
  }
}
```

---

## 13. PERFORMANCE STANDARDS

- Never load entire tables into memory and filter in JavaScript.
  All filtering, sorting, and searching must happen in the SQL query.
- Always use indexes on columns that are frequently used in WHERE
  clauses. Add @Index() to entity columns like status, createdAt,
  workerId, clientId.
- For reporting queries (gross profit, net profit, monthly summaries),
  use TypeORM QueryBuilder with GROUP BY and SUM/COUNT in SQL — never
  fetch all rows and calculate in JavaScript.
- For any query joining more than 2 tables, explicitly select only the
  columns needed. Avoid loading full entity objects when only 2-3 fields
  are required.
- Use transactions for any operation that involves writing to 2 or more
  tables. If one write fails, all must roll back.

```typescript
// ✅ Correct — transaction for multi-table write
async processWeeklySalary(workerId: number): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    const worker = await manager.findOne(Worker, { where: { id: workerId } });
    // deduct advance, create salary payment record, update worker balance
    // if any step throws, the whole transaction rolls back automatically
  });
}
```

---

## 14. HARDCODING STANDARDS

### Environment Variables
- All environment-specific values (DB credentials, JWT secret, port,
  client URLs) must live in .env.
- Access via ConfigService only — never process.env directly in code.
- Document every variable in .env.example.

### Constants & Enums
- All status values, role names, payment types, and fixed string values
  must be defined as TypeScript enums or const objects in the relevant
  constants file — never as inline strings.

```typescript
// ✅ Correct — constants file
// src/inventory/constants/inventory.constants.ts
export enum InventoryStatus {
  AVAILABLE = 'available',
  CONSUMED = 'consumed',
  LOW_STOCK = 'low_stock',
}

export enum UnitOfMeasure {
  KG = 'kg',
  METER = 'meter',
  PIECE = 'piece',
  LITER = 'liter',
}

// ❌ Wrong — magic strings in service
if (item.status === 'consumed') { ... }   // fragile, not refactorable
```

### API Routes
- All route prefixes are defined once in the controller's @Controller()
  decorator. They are never repeated inside method decorators.

---

## FINAL CHECKLIST — BEFORE COMPLETING ANY TASK

Before considering any task done, verify:

[ ] No console.log, console.warn, or console.error anywhere — use Logger
[ ] No unused imports, variables, parameters, or methods
[ ] No any type used anywhere in TypeScript
[ ] No hardcoded secrets, URLs, magic strings, or magic numbers
[ ] No raw process.env access — all config through ConfigService
[ ] No business logic inside controllers — controllers are thin
[ ] No database queries inside controllers — always goes through service
[ ] No raw entity objects returned from controllers — always use response DTOs
[ ] Every endpoint has a full set of Swagger decorators
[ ] Every DTO has class-validator decorators on every property
[ ] All financial values stored as DECIMAL not FLOAT
[ ] All user inputs go through the global ValidationPipe
[ ] No SELECT * queries — always select specific columns
[ ] All list endpoints are paginated with page and limit
[ ] All responses follow the standard envelope format
[ ] All multi-table writes use transactions
[ ] All error cases throw NestJS HTTP exceptions (not raw Error())
[ ] JWT secret and DB credentials are in .env only
[ ] Passwords are hashed with bcrypt before saving
[ ] No SQL string concatenation with user input — use parameterized queries
[ ] No synchronize: true in production config
[ ] npm run build passes with zero TypeScript errors
[ ] npm run lint passes with zero errors
