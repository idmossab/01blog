package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Comment;

@Repository
public interface CommentRepo extends JpaRepository<Comment, Long> {
    List<Comment> findByBlogIdBlog(Long blogId);
    List<Comment> findByUserUserId(Long userId);
    long countByBlogIdBlog(Long blogId);
}
