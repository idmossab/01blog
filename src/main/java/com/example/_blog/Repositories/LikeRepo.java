package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Like;

@Repository
public interface LikeRepo extends JpaRepository<Like, Long> {
    List<Like> findByBlogIdBlog(Long blogId);
    List<Like> findByUserUserId(Long userId);
    boolean existsByBlogIdBlogAndUserUserId(Long blogId, Long userId);
    Like findByBlogIdBlogAndUserUserId(Long blogId, Long userId);
    long countByBlogIdBlog(Long blogId);
}
