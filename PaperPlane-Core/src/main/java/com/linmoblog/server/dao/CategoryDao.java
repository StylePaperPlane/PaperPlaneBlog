package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Category;
import com.linmoblog.server.mapper.CategoryMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CategoryDao {
    private final CategoryMapper categoryMapper;

    public CategoryDao(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    public List<Category> getCategories() {
        return categoryMapper.getCategories();
    }

    public void addCategory(Category category) {
        categoryMapper.addCategory(category);
    }

    public void deleteCategory(List<Integer> categories) {
        categoryMapper.deleteCategory(categories);
    }

    public void updateCategory(Integer id, Category category) {
        categoryMapper.updateCategory(id, category);
    }
}
