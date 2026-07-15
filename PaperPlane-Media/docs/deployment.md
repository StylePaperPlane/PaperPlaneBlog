# Production deployment

1. Back up `/opt/paperplane/docker-compose.yml`, frontend Nginx and the database.
2. Issue the `media.paperplane.codes` certificate before enabling the TLS server block.
3. Create the `paperplane_media` PostgreSQL role with a distinct runtime password. Run migrations as the database owner, then apply `deploy/roles.sql` grants.
4. Supply production secrets only through a root-readable environment file. Never commit them.
5. Run `mediactl import-legacy --dry-run`, then `--apply`; verify both legacy tracks before switching the frontend and removing Core music routes.
6. Keep the old table and original music files read-only for seven days. Cleanup requires a separately reviewed operation after the rollback window.
7. Set Cloudflare `/assets/*` to cache everything for one year while ignoring query strings; bypass cache for `/v1/*`.

Rollback restores the previous compose file, backend JAR, frontend distribution and Nginx configuration. The legacy table and original files deliberately remain untouched during the migration window.
