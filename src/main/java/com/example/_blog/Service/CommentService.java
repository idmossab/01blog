package com.example._blog.Service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Comment;
import com.example._blog.Entity.User;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.CommentRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class CommentService {
    private final CommentRepo commentRepo;
    private final BlogRepo blogRepo;
    private final UserRepo userRepo;

    public CommentService(CommentRepo commentRepo, BlogRepo blogRepo, UserRepo userRepo) {
        this.commentRepo = commentRepo;
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public Comment add(Long blogId, Long userId, Comment comment) {
        Blog blog = blogRepo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        comment.setBlog(blog);
        comment.setUser(user);
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(null);

        Comment saved = commentRepo.save(comment);
        blog.setCommentCount(blog.getCommentCount() + 1);
        blogRepo.save(blog);
        return saved;
    }

    public Comment update(Long commentId, Comment changes) {
        Comment existing = getById(commentId);
        if (changes.getContent() != null) {
            existing.setContent(changes.getContent());
        }
        existing.setUpdatedAt(Instant.now());
        return commentRepo.save(existing);
    }

    @Transactional
    public void delete(Long commentId) {
        Comment existing = getById(commentId);
        Blog blog = existing.getBlog();
        commentRepo.delete(existing);
        if (blog != null && blog.getCommentCount() != null && blog.getCommentCount() > 0) {
            blog.setCommentCount(blog.getCommentCount() - 1);
            blogRepo.save(blog);
        }
    }

    public Comment getById(Long commentId) {
        return commentRepo.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Comment not found"));
    }

    public List<Comment> getByBlog(Long blogId) {
        return commentRepo.findByBlogId(blogId);
    }

    public List<Comment> getByUser(Long userId) {
        return commentRepo.findByUserId(userId);
    }
}
