package com.example._blog.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Entity.Like;
import com.example._blog.Service.LikeService;
import com.example._blog.Service.LikeService.LikeStatus;

@RestController
@RequestMapping("/likes")
public class LikeCont {
    private final LikeService service;

    public LikeCont(LikeService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Like> like(@RequestParam Long blogId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.like(blogId, userId));
    }

    @DeleteMapping
    public ResponseEntity<Void> unlike(@RequestParam Long blogId, @RequestParam Long userId) {
        service.unlike(blogId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status")
    public ResponseEntity<LikeStatus> getStatus(@RequestParam Long blogId, @RequestParam Long userId) {
        return ResponseEntity.ok(service.getStatus(blogId, userId));
    }
}
