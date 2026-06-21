// Domain enums for the field-mappings module. Mongoose schema removed in P5 (ADR-0035).

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
