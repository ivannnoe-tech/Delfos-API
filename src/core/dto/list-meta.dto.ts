import { ApiProperty } from '@nestjs/swagger';

export class ListMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 25 })
  pageSize!: number;

  @ApiProperty({ example: 0 })
  total!: number;

  @ApiProperty({ example: 0 })
  totalPages!: number;
}

export interface ListResponse<TItem> {
  items: TItem[];
  meta: ListMetaDto;
}

export function buildListMeta(page: number, pageSize: number, total: number): ListMetaDto {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
