package com.linmoblog.server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        boolean userTableExists = checkUserTableExists();
        logger.info("Database app_user table exists: {}", userTableExists);
        if (!userTableExists) {
            executeDbSql();
        }
        ensureImageFolderSchema();
        executeMusicSql();
    }

    private boolean checkUserTableExists() {
        String sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_user'";
        int count = jdbcTemplate.queryForObject(sql, Integer.class);
        return count > 0;
    }

    private void executeDbSql() {
        executeSqlScript("db_init/db.sql", "database initialization");
    }

    private void executeMusicSql() {
        executeSqlScript("db_init/music.sql", "music initialization");
    }

    private void ensureImageFolderSchema() {
        jdbcTemplate.execute("""
                create table if not exists image_folders
                (
                    folder_key serial primary key,
                    folder_name varchar(50) not null unique
                )
                """);
        jdbcTemplate.execute("alter table images add column if not exists folder_name varchar(50)");
        jdbcTemplate.update("update images set folder_name = '默认文件夹' where folder_name is null or trim(folder_name) = ''");
        jdbcTemplate.execute("alter table images alter column folder_name set default '默认文件夹'");
        jdbcTemplate.execute("alter table images alter column folder_name set not null");
        jdbcTemplate.update("insert into image_folders (folder_name) values ('默认文件夹') on conflict (folder_name) do nothing");
        jdbcTemplate.update("""
                insert into image_folders (folder_name)
                select distinct folder_name
                from images
                where folder_name is not null and trim(folder_name) <> ''
                on conflict (folder_name) do nothing
                """);
    }

    private void executeSqlScript(String location, String description) {
        try (Connection connection = dataSource.getConnection()) {
            Resource resource = new ClassPathResource(location);
            ScriptUtils.executeSqlScript(connection, resource);
        } catch (Exception e) {
            logger.error("Failed to execute {} script", description, e);
        }
    }
}
