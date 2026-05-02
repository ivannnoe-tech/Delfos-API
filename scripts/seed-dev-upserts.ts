import { Model, Types } from 'mongoose';

import {
  Connection,
  ConnectionAuthType,
  ConnectionDocument,
  ConnectionStatus,
  ConnectionType,
} from '../src/modules/connections/schemas/connection.schema';
import {
  Credential,
  CredentialDocument,
  CredentialStatus,
  CredentialType,
} from '../src/modules/credentials/schemas/credential.schema';
import {
  DashboardDefinition,
  DashboardDefinitionDocument,
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../src/modules/dashboard-definitions/schemas/dashboard-definition.schema';
import {
  Dataset,
  DatasetDocument,
  DatasetRefreshMode,
  DatasetSchemaMode,
  DatasetSourceType,
  DatasetStatus,
} from '../src/modules/datasets/schemas/dataset.schema';
import {
  FieldMapping,
  FieldMappingDocument,
  FieldMappingStatus,
} from '../src/modules/field-mappings/schemas/field-mapping.schema';
import {
  QueryDefinition,
  QueryDefinitionDocument,
  QueryDefinitionStatus,
} from '../src/modules/query-definitions/schemas/query-definition.schema';
import {
  ReportDefinition,
  ReportDefinitionDocument,
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../src/modules/report-definitions/schemas/report-definition.schema';
import { Tenant, TenantDocument, TenantStatus } from '../src/modules/tenants/schemas/tenant.schema';
import { User, UserDocument, UserRole, UserStatus } from '../src/modules/users/schemas/user.schema';
import {
  buildDashboardInput,
  buildDatasetInputs,
  buildFieldMappingInputs,
  buildQueryFilter,
  buildQueryInputs,
  buildReportInput,
  buildQuerySorts,
  demoActorId,
  demoAllowedGranularities,
  demoSeedKeys,
} from './seed-dev-data';

export {
  Connection,
  Credential,
  Dataset,
  DashboardDefinition,
  FieldMapping,
  QueryDefinition,
  ReportDefinition,
  Tenant,
  User,
};

export async function upsertTenant(model: Model<TenantDocument>): Promise<TenantDocument> {
  return model
    .findOneAndUpdate(
      { slug: demoSeedKeys.tenantSlug },
      {
        $set: {
          name: 'Delfos Demo Local',
          slug: demoSeedKeys.tenantSlug,
          status: TenantStatus.Active,
          settings: {
            environment: 'local',
            demo: true,
            dataPolicy: 'fictional-configuration-only',
          },
        },
      },
      upsertOptions(),
    )
    .exec();
}

export async function upsertOwnerUser(
  model: Model<UserDocument>,
  tenantId: Types.ObjectId,
): Promise<UserDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, email: demoSeedKeys.ownerEmail },
      {
        $set: {
          tenantId,
          name: 'Owner Demo',
          email: demoSeedKeys.ownerEmail,
          role: UserRole.Owner,
          status: UserStatus.Active,
        },
      },
      upsertOptions(),
    )
    .exec();
}

export async function upsertConnection(
  model: Model<ConnectionDocument>,
  tenantId: Types.ObjectId,
): Promise<ConnectionDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, name: demoSeedKeys.connectionName },
      {
        $set: {
          tenantId,
          name: demoSeedKeys.connectionName,
          type: ConnectionType.CustomerApi,
          baseUrl: 'https://demo-api.invalid',
          authType: ConnectionAuthType.BearerToken,
          allowedHeaders: ['x-demo-tenant'],
          metadata: {
            environment: 'local',
            provider: 'demo',
            note: 'fictional-source-no-external-call',
          },
          status: ConnectionStatus.Active,
        },
      },
      upsertOptions(),
    )
    .exec();
}

export async function upsertCredential(
  model: Model<CredentialDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
  protectedCredential: {
    protectedValue: string;
    provider: string;
    maskedPreview: string | null;
  },
): Promise<CredentialDocument> {
  return model
    .findOneAndUpdate(
      { tenantId, connectionId, name: demoSeedKeys.credentialName },
      {
        $set: {
          tenantId,
          connectionId,
          type: CredentialType.BearerToken,
          provider: 'demo-local',
          name: demoSeedKeys.credentialName,
          status: CredentialStatus.Active,
          maskedPreview: protectedCredential.maskedPreview,
          protectedSecretValue: protectedCredential.protectedValue,
          protectionProvider: protectedCredential.provider,
          updatedBy: demoActorId,
        },
        $setOnInsert: { createdBy: demoActorId },
      },
      upsertOptions(),
    )
    .exec();
}

export async function attachCredentialRef(
  model: Model<ConnectionDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
  credentialRef: string,
): Promise<ConnectionDocument> {
  const connection = await model
    .findOneAndUpdate(
      { _id: connectionId, tenantId },
      { $set: { credentialRef } },
      { new: true, runValidators: true },
    )
    .exec();

  if (!connection) {
    throw new Error('Demo connection was not found after creation.');
  }

  return connection;
}

export async function upsertDatasets(
  model: Model<DatasetDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
): Promise<DatasetDocument[]> {
  const datasets: DatasetDocument[] = [];

  for (const input of buildDatasetInputs()) {
    const dataset = await model
      .findOneAndUpdate(
        { tenantId, datasetKey: input.datasetKey },
        {
          $set: {
            ...input,
            tenantId,
            connectionId,
            sourceType: DatasetSourceType.Api,
            status: DatasetStatus.Active,
            refreshMode: DatasetRefreshMode.Manual,
            schemaMode: DatasetSchemaMode.Declared,
            settings: { defaultPageSize: 25, devSeed: true },
            updatedBy: demoActorId,
          },
          $setOnInsert: { createdBy: demoActorId },
        },
        upsertOptions(),
      )
      .exec();

    datasets.push(dataset);
  }

  return datasets;
}

export async function upsertFieldMappings(
  model: Model<FieldMappingDocument>,
  tenantId: Types.ObjectId,
  connectionId: Types.ObjectId,
): Promise<void> {
  for (const input of buildFieldMappingInputs()) {
    await model
      .findOneAndUpdate(
        { tenantId, datasetKey: input.datasetKey, targetField: input.targetField },
        { $set: { ...input, tenantId, connectionId, status: FieldMappingStatus.Active } },
        upsertOptions(),
      )
      .exec();
  }
}

export async function upsertQueryDefinitions(
  model: Model<QueryDefinitionDocument>,
  tenantId: Types.ObjectId,
  datasets: DatasetDocument[],
): Promise<QueryDefinitionDocument[]> {
  const datasetsByKey = new Map(datasets.map((dataset) => [dataset.datasetKey, dataset]));
  const queries: QueryDefinitionDocument[] = [];

  for (const input of buildQueryInputs()) {
    const dataset = datasetsByKey.get(input.datasetKey);

    if (!dataset) {
      throw new Error(`Dataset ${input.datasetKey} is required for query seed.`);
    }

    const query = await model
      .findOneAndUpdate(
        { tenantId, queryKey: input.queryKey },
        {
          $set: {
            ...input,
            tenantId,
            datasetId: dataset._id,
            status: QueryDefinitionStatus.Active,
            filters: [buildQueryFilter(input.timeField)],
            sorts: buildQuerySorts(input.timeField),
            defaultLimit: 100,
            allowedGranularities: demoAllowedGranularities,
            metadata: { domain: 'demo', devSeed: true },
            settings: { visibleInBuilder: true },
            updatedBy: demoActorId,
          },
          $setOnInsert: { createdBy: demoActorId },
        },
        upsertOptions(),
      )
      .exec();

    queries.push(query);
  }

  return queries;
}

export async function upsertDashboardDefinitions(
  model: Model<DashboardDefinitionDocument>,
  tenantId: Types.ObjectId,
  queries: QueryDefinitionDocument[],
): Promise<DashboardDefinitionDocument[]> {
  const input = buildDashboardInput({
    salesOverview: requireQuery(queries, 'sales_overview_demo')._id,
    salesByDay: requireQuery(queries, 'sales_by_day_demo')._id,
    customersSummary: requireQuery(queries, 'customers_summary_demo')._id,
  });

  const dashboard = await model
    .findOneAndUpdate(
      { tenantId, dashboardKey: input.dashboardKey },
      {
        $set: {
          ...input,
          tenantId,
          status: DashboardDefinitionStatus.Active,
          visibility: DashboardDefinitionVisibility.Tenant,
          updatedBy: demoActorId,
        },
        $setOnInsert: { createdBy: demoActorId },
      },
      upsertOptions(),
    )
    .exec();

  return [dashboard];
}

export async function upsertReportDefinitions(
  model: Model<ReportDefinitionDocument>,
  tenantId: Types.ObjectId,
  queries: QueryDefinitionDocument[],
  dashboards: DashboardDefinitionDocument[],
): Promise<ReportDefinitionDocument[]> {
  const input = buildReportInput({
    salesOverview: requireQuery(queries, 'sales_overview_demo')._id,
    commercialDashboard: requireDashboard(dashboards, 'commercial_dashboard_demo')._id,
  });

  const report = await model
    .findOneAndUpdate(
      { tenantId, reportKey: input.reportKey },
      {
        $set: {
          ...input,
          tenantId,
          status: ReportDefinitionStatus.Active,
          visibility: ReportDefinitionVisibility.Tenant,
          updatedBy: demoActorId,
        },
        $setOnInsert: { createdBy: demoActorId },
      },
      upsertOptions(),
    )
    .exec();

  return [report];
}

export function toCredentialRef(id: Types.ObjectId): string {
  return `cred_${id.toString()}`;
}

function requireQuery(
  queries: QueryDefinitionDocument[],
  queryKey: string,
): QueryDefinitionDocument {
  const query = queries.find((item) => item.queryKey === queryKey);

  if (!query) {
    throw new Error(`Query definition ${queryKey} is required for dashboard seed.`);
  }

  return query;
}

function requireDashboard(
  dashboards: DashboardDefinitionDocument[],
  dashboardKey: string,
): DashboardDefinitionDocument {
  const dashboard = dashboards.find((item) => item.dashboardKey === dashboardKey);

  if (!dashboard) {
    throw new Error(`Dashboard definition ${dashboardKey} is required for report seed.`);
  }

  return dashboard;
}

function upsertOptions(): {
  new: true;
  runValidators: true;
  setDefaultsOnInsert: true;
  upsert: true;
} {
  return { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true };
}
