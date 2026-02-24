package com.example._blog.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Sort;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example._blog.Dto.BlogCreateRequest;
import com.example._blog.Dto.BlogResponse;
import com.example._blog.Dto.BlogUpdateRequest;
import com.example._blog.Dto.MediaResponse;
import com.example._blog.Entity.Blog;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.CommentRepo;
import com.example._blog.Repositories.LikeRepo;
import com.example._blog.Repositories.NotificationRepo;
import com.example._blog.Repositories.ReportRepo;
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
    private final ReportRepo reportRepo;

    public BlogService(BlogRepo blogRepo, UserRepo userRepo, MediaService mediaService, FollowService followService,
            CommentRepo commentRepo, LikeRepo likeRepo, NotificationRepo notificationRepo, ReportRepo reportRepo) {
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
        this.mediaService = mediaService;
        this.followService = followService;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.notificationRepo = notificationRepo;
        this.reportRepo = reportRepo;
    }

    public BlogResponse create(BlogCreateRequest request, Long userId) {
        if (!hasText(request.title()) || !hasText(request.content())) {
            throw new ResponseStatusException(BAD_REQUEST, "Blog content cannot be empty");
        }
        validateContentLength(request.content());
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Blog blog = Blog.builder()
                .title(request.title())
                .content(request.content())
                .status(request.status() == null ? BlogStatus.ACTIVE : request.status())
                .user(user)
                .createdAt(Instant.now())
                .updatedAt(null)
                .build();

        return toResponse(blogRepo.save(blog));
    }

    @org.springframework.transaction.annotation.Transactional
    public BlogResponse createWithMedia(Long userId, String title, String content, BlogStatus status,
            List<MultipartFile> files) {
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
        return toResponse(saved);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void validateContentLength(String content) {
        if (content != null && content.length() > MAX_CONTENT_LENGTH) {
            throw new ResponseStatusException(BAD_REQUEST, "Blog content cannot exceed 1000 characters");
        }
    }

    public BlogResponse update(Long blogId, BlogUpdateRequest changes) {
        Blog existing = getById(blogId);
        if (changes.title() != null) {
            existing.setTitle(changes.title());
        }
        if (changes.content() != null) {
            validateContentLength(changes.content());
            existing.setContent(changes.content());
        }
        if (changes.media() != null) {
            existing.setMedia(changes.media());
        }
        if (changes.status() != null) {
            existing.setStatus(changes.status());
        }
        existing.setUpdatedAt(Instant.now());
        return toResponse(blogRepo.save(existing));
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long blogId) {
        Blog existing = getById(blogId);
        reportRepo.deleteByBlogIdBlog(blogId);
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

    public BlogResponse getByIdResponse(Long blogId) {
        Blog blog = getById(blogId);
        if (blog.getStatus() == BlogStatus.HIDDEN) {
            throw new ResponseStatusException(NOT_FOUND, "Blog not found");
        }
        return toResponse(blog);
    }

    public List<BlogResponse> getByUser(Long userId) {
        return blogRepo.findByUserUserIdAndStatus(userId, BlogStatus.ACTIVE).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BlogResponse> getByStatus(BlogStatus status) {
        if (status == BlogStatus.HIDDEN) {
            return List.of();
        }
        return blogRepo.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Blog> getFeed(Long currentUserId) {
        List<Long> authorIds = new ArrayList<>(followService.getFollowingIds(currentUserId));
        authorIds.add(currentUserId);
        return blogRepo.findFeedBlogs(authorIds, BlogStatus.ACTIVE);
    }

    public List<BlogResponse> getFeedResponses(Long currentUserId) {
        return getFeed(currentUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Blog> getMyBlogs(Long currentUserId) {
        return blogRepo.findByUserUserIdAndStatusOrderByCreatedAtDesc(currentUserId, BlogStatus.ACTIVE);
    }

    public List<BlogResponse> getMyBlogsResponses(Long currentUserId) {
        return getMyBlogs(currentUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    public long getMyBlogCount(Long currentUserId) {
        return blogRepo.countByUserUserIdAndStatus(currentUserId, BlogStatus.ACTIVE);
    }

    public List<BlogResponse> getAllResponses() {
        return blogRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toResponse)
                .toList();
    }

    public BlogResponse updateStatus(Long blogId, BlogStatus status) {
        Blog existing = getById(blogId);
        existing.setStatus(status);
        existing.setUpdatedAt(Instant.now());
        return toResponse(blogRepo.save(existing));
    }

    private BlogResponse toResponse(Blog blog) {
        List<MediaResponse> mediaFiles;
        if (blog.getIdBlog() == null) {
            mediaFiles = Collections.emptyList();
        } else {
            mediaFiles = mediaService.getByBlog(blog.getIdBlog());
        }

        return new BlogResponse(
                blog.getIdBlog(),
                blog.getTitle(),
                blog.getContent(),
                blog.getStatus(),
                blog.getUser() == null ? null : blog.getUser().getUserId(),
                blog.getUser() == null ? null : blog.getUser().getUserName(),
                blog.getUser() == null ? null : blog.getUser().getFirstName(),
                blog.getUser() == null ? null : blog.getUser().getLastName(),
                blog.getMedia(),
                blog.getCommentCount(),
                blog.getLikeCount(),
                blog.getCreatedAt(),
                blog.getUpdatedAt(),
                mediaFiles);
    }
}
