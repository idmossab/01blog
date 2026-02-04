package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Like;
import java.util.Optional;

@Repository
public interface LikeRepo extends JpaRepository<Like, Long> {
    List<Like> findByBlogId(Long blogId);
    List<Like> findByUserId(Long userId);
    boolean existsByBlogIdAndUserId(Long blogId, Long userId);
    Optional<Like> findByBlogIdAndUserId(Long blogId, Long userId);
    long countByBlogId(Long blogId);
}
