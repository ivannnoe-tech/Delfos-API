import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum FieldMappingStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum FieldMappingTargetType {
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Boolean = 'boolean',
  Date = 'date',
  Datetime = 'datetime',
  Money = 'money',
  Percentage = 'percentage',
  Enum = 'enum',
}

export enum FieldMappingTransform {
  Trim = 'trim',
  Uppercase = 'uppercase',
  Lowercase = 'lowercase',
  StringToNumber = 'string_to_number',
  StringToDate = 'string_to_date',
  NumberToMoney = 'number_to_money',
}

@Schema({ collection: 'field_mappings', timestamps: true })
export class FieldMapping {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Connection' })
  connectionId?: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  datasetKey!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  sourcePath!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  targetField!: string;

  @Prop({ enum: FieldMappingTargetType, required: true })
  targetType!: FieldMappingTargetType;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ enum: FieldMappingTransform })
  transform?: FieldMappingTransform;

  @Prop({ enum: FieldMappingStatus, default: FieldMappingStatus.Active })
  status!: FieldMappingStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type FieldMappingDocument = HydratedDocument<FieldMapping> & { _id: Types.ObjectId };

export const FieldMappingSchema = SchemaFactory.createForClass(FieldMapping);

FieldMappingSchema.index({ tenantId: 1, datasetKey: 1, targetField: 1 }, { unique: true });
FieldMappingSchema.index({ tenantId: 1, connectionId: 1 });
FieldMappingSchema.index({ tenantId: 1, status: 1 });
