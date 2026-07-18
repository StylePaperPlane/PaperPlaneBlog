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
        if (userTableExists) {
            logger.info("Existing database detected; runtime schema initialization is skipped");
            return;
        }

        executeDbSql();
    }

    private boolean checkUserTableExists() {
        String sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_user'";
        int count = jdbcTemplate.queryForObject(sql, Integer.class);
        return count > 0;
    }

    private void executeDbSql() {
        executeSqlScript("db_init/db.sql", "database initialization");
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
