package com.paperplane.blog.Mapper;

import com.paperplane.blog.Entity.Category;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CategoryMapper {

    List<Category> getCategories();

    @Insert("insert into categories (category_title,path_name,introduce,icon,color) values(#{categoryTitle},#{pathName},#{introduce},#{icon},#{color})")
    void addCategory(Category category);

    void deleteCategory(List<Integer> categories);

    void updateCategory(Integer id, Category category);
}
