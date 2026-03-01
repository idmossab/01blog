package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Entity.Comment;
import com.example._blog.Service.CommentService;

@RestController
@RequestMapping("/comments")
public class CommentCont {
    private final CommentService service;

    public CommentCont(CommentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Comment> add(@RequestParam Long blogId,
                                       @RequestParam Long userId,
                                       @RequestBody Comment comment) {
        return ResponseEntity.ok(service.add(blogId, userId, comment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long commentId) {
        service.delete(commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{commentId}")
    public ResponseEntity<Comment> getById(@PathVariable Long commentId) {
        return ResponseEntity.ok(service.getById(commentId));
    }

    @GetMapping("/by-blog/{blogId}")
    public ResponseEntity<List<Comment>> getByBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getByBlog(blogId));
    }
}
