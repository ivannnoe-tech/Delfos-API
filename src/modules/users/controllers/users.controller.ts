import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { ApiFoundationAuthHeaders } from '../../auth/decorators/api-foundation-auth-headers.decorator';
import { AdminKeyGuard } from '../../auth/guards/admin-key.guard';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../../auth/types/admin-role';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto, TenantScopedQueryDto } from '../dto/user-query.dto';
import { UserListResponseDto, UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../services/users.service';

class UserIdParamDto {
  @IsMongoId()
  id!: string;
}

@ApiTags('users')
@ApiFoundationAuthHeaders()
@UseGuards(AdminKeyGuard, AdminRolesGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a foundation user record.',
    description:
      'Protected by temporary foundation admin-key auth. This endpoint still does not create login credentials.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin)
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users by tenant.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authenticated tenant context exists.',
  })
  @ApiOkResponse({ type: UserListResponseDto })
  findByTenant(@Query() query: ListUsersQueryDto): Promise<UserListResponseDto> {
    return this.usersService.findByTenant(query.tenantId, query.page, query.pageSize);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a foundation user record.',
    description:
      'Protected by temporary foundation admin-key auth. tenantId remains explicit until final authorization exists.',
  })
  @AdminRoles(AdminRole.Owner, AdminRole.Admin)
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param() params: UserIdParamDto,
    @Query() query: TenantScopedQueryDto,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(query.tenantId, params.id, dto);
  }
}
