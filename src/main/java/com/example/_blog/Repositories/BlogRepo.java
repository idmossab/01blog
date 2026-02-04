package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.enums.BlogStatus;

@Repository
public interface BlogRepo extends JpaRepository<Blog, Long> {
    List<Blog> findByUserId(Long userId);
    List<Blog> findByStatus(BlogStatus status);
    List<Blog> findByUserIdAndStatus(Long userId, BlogStatus status);
    long countByUserId(Long userId);
}
