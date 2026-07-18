package com.linmoblog.server.config;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DatabaseInitializerTest {

    @Test
    void existingDatabaseIsNeverMutatedAtApplicationStartup() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        DataSource dataSource = mock(DataSource.class);
        when(jdbcTemplate.queryForObject(anyString(), org.mockito.ArgumentMatchers.eq(Integer.class)))
                .thenReturn(1);

        new DatabaseInitializer(jdbcTemplate, dataSource).run();

        verify(jdbcTemplate).queryForObject(anyString(), org.mockito.ArgumentMatchers.eq(Integer.class));
        verify(jdbcTemplate, never()).execute(anyString());
        verify(jdbcTemplate, never()).update(anyString());
        verifyNoInteractions(dataSource);
    }
}
