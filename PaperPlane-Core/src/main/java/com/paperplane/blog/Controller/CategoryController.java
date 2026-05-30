package com.paperplane.blog.Controller;

import com.paperplane.blog.Entity.Category;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.vo.CategoryVO;
import com.paperplane.blog.Service.CategoryService;
import com.paperplane.blog.aspect.ApiOperationLog;
import com.paperplane.blog.enums.ResultCode;
import com.paperplane.blog.exception.CommonException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "分类接口")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @ApiOperationLog(description = "返回所有分类")
    @Operation(summary = "返回所有分类")
    @GetMapping("/public/category")
    public Result<List<CategoryVO>> getCategoryList(){
       return Result.success(categoryService.getCategoryList());
    }

    @ApiOperationLog(description = "添加分类")
    @Operation(summary ="添加分类")
    @PostMapping("/protected/category")
    public Result<Null> addCategory(@RequestBody Category category){
        return categoryService.addCategory(category);
    }

    @ApiOperationLog(description = "删除分类")
    @Operation(summary ="删除分类")
    @DeleteMapping("/protected/category")
    public Result<Null> deleteCategory(@RequestBody List<Integer> categories){
        return categoryService.deleteCategory(categories);
    }

    @ApiOperationLog(description = "根据id修改分类")
    @Operation(summary ="根据id修改分类")
    @PostMapping("/protected/category/{id}")
    public Result<Void> updateCategory(@PathVariable Integer id,@Valid @RequestBody Category category){
        if (id == null) {
            throw new CommonException(ResultCode.FAILED);
        }
        categoryService.updateCategory(id,category);
        return Result.success();
    }
}
