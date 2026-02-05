package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.enums.BlogStatus;

@Repository
public interface BlogRepo extends JpaRepository<Blog, Long> {
    List<Blog> findByUserUserId(Long userId);
    List<Blog> findByStatus(BlogStatus status);
    List<Blog> findByUserUserIdAndStatus(Long userId, BlogStatus status);
    long countByUserUserId(Long userId);

    @Query("select b from Blog b where b.user.userId in :authorIds")
    Page<Blog> findFeedBlogs(@Param("authorIds") List<Long> authorIds, Pageable pageable);
}
