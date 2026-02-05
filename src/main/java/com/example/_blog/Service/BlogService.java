package com.example._blog.Service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class BlogService {
    private final BlogRepo blogRepo;
    private final UserRepo userRepo;
    private final MediaService mediaService;

    public BlogService(BlogRepo blogRepo, UserRepo userRepo, MediaService mediaService) {
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
        this.mediaService = mediaService;
    }

    public Blog create(Blog blog, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        blog.setUser(user);
        blog.setCreatedAt(Instant.now());
        blog.setUpdatedAt(null);
        return blogRepo.save(blog);
    }

    @org.springframework.transaction.annotation.Transactional
    public Blog createWithMedia(Long userId, String title, String content, BlogStatus status,
                                java.util.List<org.springframework.web.multipart.MultipartFile> files) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Blog blog = Blog.builder()
                .title(title)
                .content(content)
                .status(status == null ? BlogStatus.ACTIVE : status)
                .user(user)
                .createdAt(Instant.now())
                .updatedAt(null)
                .build();

        Blog saved = blogRepo.save(blog);
        mediaService.uploadToBlog(saved, files, false);
        return saved;
    }

    public Blog update(Long blogId, Blog changes) {
        Blog existing = getById(blogId);
        if (changes.getTitle() != null) {
            existing.setTitle(changes.getTitle());
        }
        if (changes.getContent() != null) {
            existing.setContent(changes.getContent());
        }
        if (changes.getMedia() != null) {
            existing.setMedia(changes.getMedia());
        }
        if (changes.getStatus() != null) {
            existing.setStatus(changes.getStatus());
        }
        existing.setUpdatedAt(Instant.now());
        return blogRepo.save(existing);
    }

    public void delete(Long blogId) {
        Blog existing = getById(blogId);
        blogRepo.delete(existing);
    }

    public Blog getById(Long blogId) {
        return blogRepo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));
    }

    public List<Blog> getByUser(Long userId) {
        return blogRepo.findByUserUserId(userId);
    }

    public List<Blog> getByStatus(BlogStatus status) {
        return blogRepo.findByStatus(status);
    }
}
