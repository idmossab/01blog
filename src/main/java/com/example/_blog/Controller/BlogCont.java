package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import com.example._blog.Dto.request.BlogCreateRequest;
import com.example._blog.Dto.response.BlogResponse;
import com.example._blog.Dto.request.BlogUpdateRequest;
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
    public ResponseEntity<BlogResponse> create(@RequestParam Long userId, @RequestBody @Valid BlogCreateRequest request) {
        return ResponseEntity.ok(service.create(request, userId));
    }

    @PostMapping(value = "/with-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BlogResponse> createWithMedia(@RequestParam Long userId,
                                                @RequestParam String title,
                                                @RequestParam String content,
                                                @RequestParam(required = false) BlogStatus status,
                                                @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.ok(service.createWithMedia(userId, title, content, status, files));
    }

    @PutMapping("/{blogId}")
    public ResponseEntity<BlogResponse> update(@PathVariable Long blogId, @RequestBody @Valid BlogUpdateRequest changes) {
        return ResponseEntity.ok(service.update(blogId, changes));
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<Void> delete(@PathVariable Long blogId) {
        service.delete(blogId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<BlogResponse> getById(@PathVariable Long blogId) {
        return ResponseEntity.ok(service.getByIdResponse(blogId));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<BlogResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getByUser(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BlogResponse>> getByStatus(@PathVariable BlogStatus status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

}
