package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Category;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.vo.CategoryVO;
import com.linmoblog.server.service.CategoryService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "分类接口")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @ApiOperationLog(description = "返回所有分类")
    @Operation(summary = "返回所有分类")
    @GetMapping("/public/category")
    public Result<List<CategoryVO>> getCategoryList() {
        return categoryService.getCategoryList();
    }

    @ApiOperationLog(description = "添加分类")
    @Operation(summary = "添加分类")
    @PostMapping("/protected/category")
    public Result<Void> addCategory(@RequestBody Category category) {
        return categoryService.addCategory(category);
    }

    @ApiOperationLog(description = "删除分类")
    @Operation(summary = "删除分类")
    @DeleteMapping("/protected/category")
    public Result<Void> deleteCategory(@RequestBody List<Integer> categories) {
        return categoryService.deleteCategory(categories);
    }

    @ApiOperationLog(description = "根据id修改分类")
    @Operation(summary = "根据id修改分类")
    @PostMapping("/protected/category/{id}")
    public Result<Void> updateCategory(@PathVariable Integer id, @Valid @RequestBody Category category) {
        return categoryService.updateCategory(id, category);
    }
}
