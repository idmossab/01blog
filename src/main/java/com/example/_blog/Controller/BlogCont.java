package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Service.BlogService;

@RestController
@RequestMapping("/blogs")
public class BlogCont {
    private final BlogService service;

    public BlogCont(BlogService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Blog> create(@RequestParam Long userId, @RequestBody Blog blog) {
        return ResponseEntity.ok(service.create(blog, userId));
    }

    @PutMapping("/{blogId}")
    public ResponseEntity<Blog> update(@PathVariable Long blogId, @RequestBody Blog changes) {
        return ResponseEntity.ok(service.update(blogId, changes));
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<Void> delete(@PathVariable Long blogId) {
        service.delete(blogId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<Blog> getById(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getById(blogId));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<Blog>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getByUser(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Blog>> getByStatus(@PathVariable BlogStatus status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }
}
