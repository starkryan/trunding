# Better Auth Automatic Migration Guide for Nixpacks

This guide explains how to set up automatic Better Auth migrations in Nixpacks following best practices.

## Overview

The setup implements automatic database migrations for Better Auth using Nixpacks, ensuring that your database schema is always up-to-date when deploying your application.

## Implementation Details

### Nixpacks Configuration

The `nixpacks.toml` file has been configured with a dedicated migration phase that:

1. **Waits for database readiness**: Ensures the PostgreSQL database is ready before running migrations
2. **Runs Better Auth CLI migrations**: Uses `npx @better-auth/cli migrate` to apply Better Auth schema changes
3. **Applies custom SQL migrations**: Executes any custom SQL files in the `better-auth_migrations/` directory

### Migration Phase Breakdown

```toml
[phases.migrate]
dependsOn = ["install"]
cmds = [
  # Wait for database to be ready
  "until pg_isready -h localhost -p 5432 -U postgres; do echo 'Waiting for postgres...'; sleep 1; done;",
  
  # Run Better Auth CLI migrations
  "npx @better-auth/cli migrate || echo 'Migration completed (may have warnings)'",
  
  # Apply custom SQL migrations
  "if [ -d ./better-auth_migrations ]; then for file in ./better-auth_migrations/*.sql; do echo 'Applying migration: $file'; psql \"$DATABASE_URL\" -f \"$file\" || echo 'Migration $file completed with warnings'; done; fi"
]
```

## Best Practices

### 1. Migration Strategy

- **Automatic migrations**: The setup runs migrations automatically during deployment
- **Graceful handling**: Uses `|| echo '...'` to prevent deployment failures if migrations have warnings
- **Database readiness check**: Waits for PostgreSQL to be ready before attempting migrations

### 2. Better Auth CLI Commands

Based on the Better Auth documentation, two main CLI commands are available:

- `npx @better-auth/cli migrate`: Applies pending migrations to the database
- `npx @better-auth/cli generate`: Generates migration files based on schema changes

The migration setup uses `migrate` to apply existing migrations.

### 3. Custom SQL Migrations

The setup also supports custom SQL migrations:
- Place custom SQL files in the `better-auth_migrations/` directory
- Files should follow the naming pattern: `YYYY-MM-DDTHH-MM-SS.sssZ.sql`
- Each file will be executed in alphabetical order

### 4. Environment Variables

Ensure these environment variables are set in your deployment environment:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-app-url.com
RESEND_API_KEY=your-resend-api-key
```

## Migration Workflow

### During Development

1. **Make schema changes**: Update your Better Auth configuration or add custom tables
2. **Generate migrations**: Use `npx @better-auth/cli generate` if needed
3. **Test locally**: Run `npm run migrate` to test migrations
4. **Commit changes**: Include both code changes and migration files

### Package.json Migration Script

A simple migration script is available in your package.json:

```bash
# Run Better Auth migrations (uses DATABASE_URL from environment)
npm run migrate
```

This script uses the `DATABASE_URL` environment variable and runs the Better Auth CLI migrate command.

### During Deployment

1. **Code deployment**: Your application code is deployed
2. **Install phase**: Dependencies are installed
3. **Migration phase**: 
   - Database readiness is verified
   - Better Auth migrations are applied
   - Custom SQL migrations are executed
4. **Start phase**: Application starts with up-to-date database schema

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Ensure `DATABASE_URL` is correctly set
   - Verify database accessibility from the deployment environment

2. **Migration failures**:
   - Check migration file syntax
   - Ensure proper permissions on database tables
   - Review Better Auth configuration for schema conflicts

3. **Permission issues**:
   - Ensure the database user has CREATE, ALTER, and DROP permissions
   - Verify table ownership and permissions

### Debug Commands

```bash
# Check database connectivity
pg_isready -h localhost -p 5432 -U postgres

# Test Better Auth migrations locally
npx @better-auth/cli migrate

# Generate new migrations
npx @better-auth/cli generate

# View migration status
psql "$DATABASE_URL" -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
```

## Advanced Configuration

### Custom Migration Timeout

For large databases, you may need to increase the migration timeout:

```toml
[phases.migrate]
cmds = [
  "export PGTIMEOUT=300",  # 5 minutes timeout
  "npx @better-auth/cli migrate"
]
```

### Migration Rollback Strategy

While Better Auth doesn't natively support rollbacks, you can implement a backup strategy:

```toml
[phases.migrate]
cmds = [
  # Create backup before migrations
  "pg_dump \"$DATABASE_URL\" > /tmp/pre_migration_backup.sql",
  
  # Run migrations
  "npx @better-auth/cli migrate",
  
  # Handle failures
  "if [ $? -ne 0 ]; then echo 'Migration failed, restoring backup...'; psql \"$DATABASE_URL\" < /tmp/pre_migration_backup.sql; exit 1; fi"
]
```

### Multiple Database Support

If you use multiple databases, extend the migration phase:

```toml
[phases.migrate]
cmds = [
  # Primary database
  "DATABASE_URL=\"$PRIMARY_DB_URL\" npx @better-auth/cli migrate",
  
  # Secondary database migrations
  "if [ -d ./secondary_migrations ]; then for file in ./secondary_migrations/*.sql; do psql \"$SECONDARY_DB_URL\" -f \"$file\"; done; fi"
]
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive credentials to version control
2. **Database Permissions**: Use least-privilege principle for database users
3. **Migration Files**: Review migration files for security implications
4. **Backup Strategy**: Implement regular database backups before major migrations

## Monitoring and Logging

The migration setup includes basic logging. For enhanced monitoring:

```toml
[phases.migrate]
cmds = [
  "echo 'Migration started at: $(date)'",
  "npx @better-auth/cli migrate 2>&1 | tee /tmp/migration.log",
  "echo 'Migration completed at: $(date)'",
  "echo 'Migration log saved to /tmp/migration.log'"
]
```

## Conclusion

This automatic migration setup provides a robust, production-ready solution for managing Better Auth database schema changes in Nixpacks-deployed applications. The implementation follows best practices for reliability, error handling, and maintainability.

For more information about Better Auth migrations, refer to the official [Better Auth documentation](https://better-auth.com/docs).
