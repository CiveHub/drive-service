import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DriveFile } from "./entities/file.entity";
import { DriveFolder } from "./entities/folder.entity";

@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private connections: Map<string, DataSource> = new Map();

  /**
   * Get or create a dedicated connection for a tenant.
   * Development: Uses shared civehub_projects database with row-level isolation (tenant_id column).
   * Production (HIPAA/SOC2): Can use per-tenant databases if tenant.dbName is set.
   */
  async getConnection(tenant: {
    id: string;
    dbName?: string | null;
    dbHost?: string | null;
    dbUsername?: string | null;
    dbPassword?: string | null;
  }): Promise<DataSource> {
    const tenantId = tenant.id;
    if (this.connections.has(tenantId)) {
      const existing = this.connections.get(tenantId);
      if (existing?.isInitialized) return existing;
    }

    // Development: use shared civehub_projects database (row-level isolation via tenant_id)
    // Production: set tenant.dbName to use per-tenant database for compliance isolation
    const dbName =
      tenant.dbName || process.env.DATABASE_NAME || 'civehub_drive';

    const dataSource = new DataSource({
      type: "postgres",
      host: tenant.dbHost || process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "5432", 10),
      username: tenant.dbUsername || process.env.DATABASE_USER || "postgres",
      password:
        tenant.dbPassword || process.env.DATABASE_PASSWORD || "postgres",
      database: dbName,
      entities: [DriveFile, DriveFolder],
      synchronize: process.env.NODE_ENV !== "production", // Use migrations for production
      logging: process.env.NODE_ENV === "development",
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      extra: process.env.DATABASE_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {},
    });

    await dataSource.initialize();
    this.connections.set(tenantId, dataSource);
    return dataSource;
  }

  async onModuleDestroy() {
    for (const connection of this.connections.values()) {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
  }
}
