package com.example._blog.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Media;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.MediaRepo;

@Service
public class MediaService {
    private static final int MAX_FILES = 10;
    private static final Path UPLOAD_DIR = Paths.get("uploads");

    private final MediaRepo mediaRepo;
    private final BlogRepo blogRepo;

    public MediaService(MediaRepo mediaRepo, BlogRepo blogRepo) {
        this.mediaRepo = mediaRepo;
        this.blogRepo = blogRepo;
    }

    public List<Media> upload(Long blogId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "No files uploaded");
        }
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(BAD_REQUEST, "Maximum 10 files allowed");
        }

        Blog blog = blogRepo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));

        try {
            Files.createDirectories(UPLOAD_DIR);
        } catch (IOException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Failed to create upload folder");
        }

        List<Media> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String original = file.getOriginalFilename();
            String safeName = UUID.randomUUID() + "_" + (original == null ? "file" : original);
            Path target = UPLOAD_DIR.resolve(safeName);
            try {
                Files.copy(file.getInputStream(), target);
            } catch (IOException ex) {
                throw new ResponseStatusException(BAD_REQUEST, "Failed to save file");
            }
            String url = "http://localhost:8080/uploads/" + safeName;
            Media media = Media.builder()
                    .blog(blog)
                    .url(url)
                    .mediaType(file.getContentType())
                    .createdAt(Instant.now())
                    .build();
            saved.add(mediaRepo.save(media));
        }
        return saved;
    }

    public List<Media> getByBlog(Long blogId) {
        return mediaRepo.findByBlogIdBlog(blogId);
    }
}
