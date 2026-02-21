package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example._blog.Dto.MediaResponse;
import com.example._blog.Service.MediaService;

@RestController
@RequestMapping("/media")
public class MediaCont {
    private final MediaService service;

    public MediaCont(MediaService service) {
        this.service = service;
    }

    @PostMapping("/upload/{blogId}")
    public ResponseEntity<List<MediaResponse>> upload(@PathVariable Long blogId,
                                              @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(service.upload(blogId, files));
    }

    @GetMapping("/by-blog/{blogId}")
    public ResponseEntity<List<MediaResponse>> getByBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getByBlog(blogId));
    }

    @GetMapping("/first/{blogId}")
    public ResponseEntity<MediaResponse> getFirstByBlog(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getFirstByBlog(blogId));
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long mediaId) {
        service.deleteMedia(mediaId);
        return ResponseEntity.noContent().build();
    }
}
