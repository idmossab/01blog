package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example._blog.Entity.Media;
import com.example._blog.Service.MediaService;

@RestController
@RequestMapping("/media")
public class MediaCont {
    private final MediaService service;

    public MediaCont(MediaService service) {
        this.service = service;
    }

    @PostMapping("/upload/{blogId}")
    public ResponseEntity<List<Media>> upload(@PathVariable Long blogId,
                                              @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(service.upload(blogId, files));
    }

    @GetMapping("/by-blog/{blogId}")
    public ResponseEntity<List<Media>> getByBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getByBlog(blogId));
    }

    @GetMapping("/first/{blogId}")
    public ResponseEntity<Media> getFirstByBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getFirstByBlog(blogId));
    }
}
