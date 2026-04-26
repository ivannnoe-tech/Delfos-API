import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

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
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a foundation user record.',
    description:
      'Temporary administrative foundation endpoint without login, password or real auth. Authentication and authorization must be added before production.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users by tenant.',
    description:
      'Temporary administrative foundation endpoint. tenantId is explicit until real authenticated tenant context exists.',
  })
  @ApiOkResponse({ type: UserListResponseDto })
  findByTenant(@Query() query: ListUsersQueryDto): Promise<UserListResponseDto> {
    return this.usersService.findByTenant(query.tenantId, query.page, query.pageSize);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a foundation user record.',
    description:
      'Temporary administrative foundation endpoint. tenantId is explicit until real authorization exists.',
  })
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
