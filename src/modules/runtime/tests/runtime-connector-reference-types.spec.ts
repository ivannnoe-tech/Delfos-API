import { RuntimeConnectorFieldMappingDescriptor } from '../bridge';

describe('RuntimeConnector source-agnostic reference types', () => {
  it('supports SQL mappings with sourceObject/sourceFieldPath without table or column fields', () => {
    const mapping = createMapping({
      sourceObject: 'Pedidos',
      sourceFieldPath: 'ValorTotal',
    });

    expect(mapping.source).toEqual({
      sourceObject: 'Pedidos',
      sourceFieldPath: 'ValorTotal',
    });
    expect(mapping).not.toHaveProperty('table');
    expect(mapping).not.toHaveProperty('column');
  });

  it('supports REST/JSON paths', () => {
    const mapping = createMapping({
      sourceObject: '$.items[*]',
      sourceFieldPath: '$.items[*].amount',
    });

    expect(mapping.source.sourceFieldPath).toBe('$.items[*].amount');
  });

  it('supports MongoDB document paths', () => {
    const mapping = createMapping({
      sourceObject: 'orders',
      sourceFieldPath: 'items.amount',
    });

    expect(mapping.source.sourceFieldPath).toBe('items.amount');
  });

  it('supports file source objects and field paths', () => {
    const mapping = createMapping({
      sourceObject: 'sheet:Vendas',
      sourceFieldPath: 'Valor Total',
    });

    expect(mapping.source.sourceObject).toBe('sheet:Vendas');
    expect(mapping.source.sourceFieldPath).toBe('Valor Total');
  });
});

function createMapping(source: {
  sourceObject: string;
  sourceFieldPath: string;
}): RuntimeConnectorFieldMappingDescriptor {
  return {
    fieldMappingId: 'mapping_demo_001',
    datasetId: 'dataset_demo_001',
    datasetKey: 'sales_orders',
    source,
    logical: {
      logicalField: 'sales.totalAmount',
      semanticRole: 'metric',
    },
    status: 'active',
  };
}
