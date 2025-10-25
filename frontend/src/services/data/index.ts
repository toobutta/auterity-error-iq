export * from './types';
export * from './BaseDataSource';
export * from './RestDataSource';
export * from './DatabaseDataSource';

import { DataSourceType, DataSourceConfig, IDataSource } from './types';
import { RestDataSource } from './RestDataSource';
import { DatabaseDataSource } from './DatabaseDataSource';

export function createDataSource(type: DataSourceType): IDataSource {
  switch (type) {
    case 'rest':
      return new RestDataSource();
    case 'database':
      return new DatabaseDataSource();
    case 'stream':
    case 'file':
    case 'static':
      throw new Error(`Data source type '${type}' not implemented yet`);
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
}

export async function initializeDataSource(
  type: DataSourceType,
  config: DataSourceConfig
): Promise<IDataSource> {
  const dataSource = createDataSource(type);
  await dataSource.connect(config);
  return dataSource;
}
