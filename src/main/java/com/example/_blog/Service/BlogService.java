package com.example._blog.Service;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.CommentRepo;
import com.example._blog.Repositories.LikeRepo;
import com.example._blog.Repositories.NotificationRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class BlogService {
    private static final int MAX_CONTENT_LENGTH = 1000;

    private final BlogRepo blogRepo;
    private final UserRepo userRepo;
    private final MediaService mediaService;
    private final FollowService followService;
    private final CommentRepo commentRepo;
    private final LikeRepo likeRepo;
    private final NotificationRepo notificationRepo;

    public BlogService(BlogRepo blogRepo, UserRepo userRepo, MediaService mediaService, FollowService followService,
                       CommentRepo commentRepo, LikeRepo likeRepo, NotificationRepo notificationRepo) {
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
        this.mediaService = mediaService;
        this.followService = followService;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.notificationRepo = notificationRepo;
    }

    public Blog create(Blog blog, Long userId) {
        if (!hasText(blog.getTitle()) || !hasText(blog.getContent())) {
            throw new ResponseStatusException(BAD_REQUEST, "Blog content cannot be empty");
        }
        validateContentLength(blog.getContent());
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
        if (!hasText(title) || !hasText(content)) {
            throw new ResponseStatusException(BAD_REQUEST, "Blog content cannot be empty");
        }
        validateContentLength(content);
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

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void validateContentLength(String content) {
        if (content != null && content.length() > MAX_CONTENT_LENGTH) {
            throw new ResponseStatusException(BAD_REQUEST, "Blog content cannot exceed 1000 characters");
        }
    }

    public Blog update(Long blogId, Blog changes) {
        Blog existing = getById(blogId);
        if (changes.getTitle() != null) {
            existing.setTitle(changes.getTitle());
        }
        if (changes.getContent() != null) {
            validateContentLength(changes.getContent());
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

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long blogId) {
        Blog existing = getById(blogId);
        likeRepo.deleteByBlogIdBlog(blogId);
        commentRepo.deleteByBlogIdBlog(blogId);
        notificationRepo.deleteByBlogIdBlog(blogId);
        mediaService.deleteByBlog(blogId);
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

    public Page<Blog> getFeed(Long currentUserId, int page, int size) {
        List<Long> authorIds = new ArrayList<>(followService.getFollowingIds(currentUserId));
        authorIds.add(currentUserId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return blogRepo.findFeedBlogs(authorIds, pageable);
    }

    public Page<Blog> getMyBlogs(Long currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return blogRepo.findByUserUserIdOrderByCreatedAtDesc(currentUserId, pageable);
    }

    public long getMyBlogCount(Long currentUserId) {
        return blogRepo.countByUserUserId(currentUserId);
    }
}
