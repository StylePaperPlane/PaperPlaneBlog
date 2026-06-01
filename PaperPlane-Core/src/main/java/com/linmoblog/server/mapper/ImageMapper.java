package com.linmoblog.server.mapper;

import com.linmoblog.server.entity.Image;
import com.linmoblog.server.entity.ImageFolder;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ImageMapper {

    @Insert("insert into images (image_url, folder_name) values (#{imageUrl}, #{folderName})")
    void upload(@Param("imageUrl") String imageUrl, @Param("folderName") String folderName);

    void delete(@Param("imageUrlList") List<String> imageUrlList);

    @Select("select * from images where folder_name = #{folderName} order by image_key desc")
    List<Image> getImages(@Param("folderName") String folderName);

    @Insert("insert into image_folders (folder_name) values (#{folderName}) on conflict (folder_name) do nothing")
    void createFolder(@Param("folderName") String folderName);

    @Select("""
            select f.folder_key,
                   f.folder_name,
                   count(i.image_key) as image_count
            from image_folders f
            left join images i on i.folder_name = f.folder_name
            group by f.folder_key, f.folder_name
            order by f.folder_key
            """)
    List<ImageFolder> getFolders();

    void moveImages(@Param("imageUrlList") List<String> imageUrlList, @Param("folderName") String folderName);
}
