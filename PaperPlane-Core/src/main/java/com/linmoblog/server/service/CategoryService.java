package com.linmoblog.server.service;

import com.linmoblog.server.dao.CategoryDao;
import com.linmoblog.server.entity.Category;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.vo.CategoryVO;
import com.linmoblog.server.entity.vo.Pair;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    private static final String DEFAULT_COLOR = "#000000";
    private static final String DEFAULT_PATH_PREFIX = "category-";

    private final CategoryDao categoryDao;
    private final NoteService noteService;

    public CategoryService(CategoryDao categoryDao, NoteService noteService) {
        this.categoryDao = categoryDao;
        this.noteService = noteService;
    }

    public Result<List<CategoryVO>> getCategoryList() {
        List<Category> categories = categoryDao.getCategories();
        if (categories.isEmpty()) {
            return Result.success(Collections.emptyList());
        }
        List<Integer> categoryKeyList = categoryKeyList(categories);
        Map<Integer, Integer> noteCountByCategory = noteCountByCategory(categoryKeyList);
        List<CategoryVO> categoryList = categories.stream()
                .map(category -> new CategoryVO(
                        category,
                        noteCountByCategory.getOrDefault(category.getCategoryKey(), 0)))
                .collect(Collectors.toList());
        return Result.success(categoryList);
    }

    public Result<Void> addCategory(Category category) {
        normalizeCategory(category);
        categoryDao.addCategory(category);
        return Result.success();
    }

    public Result<Void> deleteCategory(List<Integer> categories) {
        categoryDao.deleteCategory(categories);
        return Result.success();
    }

    public Result<Void> updateCategory(Integer id, Category category) {
        if (id == null) {
            throw new CommonException(ResultCode.FAILED);
        }
        normalizeCategory(category);
        categoryDao.updateCategory(id, category);
        return Result.success();
    }

    private void normalizeCategory(Category category) {
        if (category == null) {
            return;
        }
        if (category.getCategoryTitle() != null) {
            category.setCategoryTitle(category.getCategoryTitle().trim());
        }
        if (category.getColor() == null || category.getColor().isBlank()) {
            category.setColor(DEFAULT_COLOR);
        }
        if (category.getPathName() == null || category.getPathName().isBlank()) {
            category.setPathName(defaultPathName(category.getCategoryTitle()));
        }
    }

    private String defaultPathName(String title) {
        return title == null || title.isBlank()
                ? DEFAULT_PATH_PREFIX + System.currentTimeMillis()
                : title.trim().replaceAll("\\s+", "-");
    }

    private List<Integer> categoryKeyList(List<Category> categories) {
        return categories.stream()
                .map(Category::getCategoryKey)
                .collect(Collectors.toList());
    }

    private Map<Integer, Integer> noteCountByCategory(List<Integer> categoryKeyList) {
        return noteService.getNoteCountByCategoryKey(categoryKeyList).stream()
                .collect(Collectors.toMap(Pair::getPairKey, pair -> ((Number) pair.getPairValue()).intValue()));
    }
}
