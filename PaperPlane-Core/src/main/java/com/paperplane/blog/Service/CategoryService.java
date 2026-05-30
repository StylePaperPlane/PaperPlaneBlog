package com.paperplane.blog.Service;

import com.paperplane.blog.Dao.CategoryDao;
import com.paperplane.blog.Entity.Category;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.vo.CategoryVO;
import com.paperplane.blog.Entity.vo.Pair;
import com.paperplane.blog.Mapper.CategoryMapper;
import com.paperplane.blog.enums.NoteStatusEnum;
import com.paperplane.blog.enums.ResultCode;
import jakarta.annotation.Resource;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    @Autowired
    private CategoryDao categoryDao;
    @Resource
    private CategoryMapper categoryMapper;
    @Resource
    private NoteService noteService;

    public  List<CategoryVO> getCategoryList() {
        List<Category> categories = categoryMapper.getCategories();
        if (categories.isEmpty()) {
            return Collections.emptyList();
        }
        ArrayList<CategoryVO> list = new ArrayList<>();
        //2. 获取 category 中的 categoryKey
        List<Integer> categoryKeyList = categories.stream().map(Category::getCategoryKey).collect(Collectors.toList());
        //3. 根据 categoryKeyList 查询文章数量
       List<Pair<Integer,Integer>> pairList =  noteService.getNoteCountByCategoryKey(categoryKeyList);
        //4. 将文章数量添加到 category 中
        for (Category category : categories) {
            CategoryVO categoryVO = new CategoryVO(category);
            for (Pair<Integer, Integer> pair : pairList) {
                if (categoryVO.getCategoryKey().equals(pair.getPairKey())) {
                    categoryVO.setNoteCount(((Number)pair.getPairValue()).intValue());
                    break;
                }
            }
            list.add(categoryVO);
        }
        return list;
    }

    public Result<Null> addCategory(Category category) {
        normalizeCategory(category);
        categoryDao.addCategory(category);
        return new Result<Null>(ResultCode.SUCCESS);
    }

    public Result<Null> deleteCategory(List<Integer> categories) {
        categoryDao.deleteCategory(categories);
        return new Result<Null>(ResultCode.SUCCESS);
    }

    public void updateCategory(Integer id, Category category) {
        normalizeCategory(category);
        categoryMapper.updateCategory(id,category);
    }

    private void normalizeCategory(Category category) {
        if (category == null) {
            return;
        }
        if (category.getCategoryTitle() != null) {
            category.setCategoryTitle(category.getCategoryTitle().trim());
        }
        if (category.getColor() == null || category.getColor().isBlank()) {
            category.setColor("#000000");
        }
        if (category.getPathName() == null || category.getPathName().isBlank()) {
            String title = category.getCategoryTitle();
            category.setPathName(title == null || title.isBlank()
                    ? "category-" + System.currentTimeMillis()
                    : title.trim().replaceAll("\\s+", "-"));
        }
    }
}
