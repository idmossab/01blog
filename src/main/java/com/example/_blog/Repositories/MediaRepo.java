package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Media;

@Repository
public interface MediaRepo extends JpaRepository<Media, Long> {
    List<Media> findByBlogId(Long blogId);
}
