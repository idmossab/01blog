package com.example._blog.Service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.CONFLICT;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Like;
import com.example._blog.Entity.User;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.LikeRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class LikeService {
    private final LikeRepo likeRepo;
    private final BlogRepo blogRepo;
    private final UserRepo userRepo;
    private final NotificationService notificationService;

    public LikeService(LikeRepo likeRepo, BlogRepo blogRepo, UserRepo userRepo,
                       NotificationService notificationService) {
        this.likeRepo = likeRepo;
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
    }

    @Transactional
    public Like like(Long blogId, Long userId) {
        if (likeRepo.existsByBlogIdBlogAndUserUserId(blogId, userId)) {
            throw new ResponseStatusException(CONFLICT, "Already liked");
        }
        Blog blog = blogRepo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Like like = Like.builder()
                .blog(blog)
                .user(user)
                .createdAt(Instant.now())
                .build();

        Like saved = likeRepo.save(like);
        blog.setLikeCount(blog.getLikeCount() + 1);
        blogRepo.save(blog);
        notificationService.notifyLike(blog, user);
        return saved;
    }

    @Transactional
    public void unlike(Long blogId, Long userId) {
        Like existing = likeRepo.findByBlogIdBlogAndUserUserId(blogId, userId);
        if (existing == null) {
            throw new ResponseStatusException(NOT_FOUND, "Like not found");
        }
        Blog blog = existing.getBlog();
        likeRepo.delete(existing);
        if (blog != null && blog.getLikeCount() != null && blog.getLikeCount() > 0) {
            blog.setLikeCount(blog.getLikeCount() - 1);
            blogRepo.save(blog);
        }
    }

    public List<Like> getByBlog(Long blogId) {
        return likeRepo.findByBlogIdBlog(blogId);
    }

    public List<Like> getByUser(Long userId) {
        return likeRepo.findByUserUserId(userId);
    }

    public LikeStatus getStatus(Long blogId, Long userId) {
        boolean liked = likeRepo.existsByBlogIdBlogAndUserUserId(blogId, userId);
        long count = likeRepo.countByBlogIdBlog(blogId);
        return new LikeStatus(liked, count);
    }

    public record LikeStatus(boolean liked, long likeCount) {}
}
