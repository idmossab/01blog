package com.example._blog.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Dto.MediaResponse;
import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Media;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.MediaRepo;

@Service
public class MediaService {
    private static final int MAX_FILES = 5;
    private static final long MAX_TOTAL_BYTES = 10L * 1024 * 1024;
    private static final Path UPLOAD_DIR = Paths.get("uploads");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "video/mp4");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "mp4");

    private final MediaRepo mediaRepo;
    private final BlogRepo blogRepo;

    public MediaService(MediaRepo mediaRepo, BlogRepo blogRepo) {
        this.mediaRepo = mediaRepo;
        this.blogRepo = blogRepo;
    }

    public List<MediaResponse> upload(Long blogId, List<MultipartFile> files) {
        Blog blog = blogRepo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));
        return uploadToBlog(blog, files, true).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<Media> uploadToBlog(Blog blog, List<MultipartFile> files) {
        return uploadToBlog(blog, files, true);
    }

    public List<Media> uploadToBlog(Blog blog, List<MultipartFile> files, boolean required) {
        List<MultipartFile> normalized = normalizeFiles(files, required);
        if (normalized.isEmpty()) {
            return List.of();
        }

        try {
            Files.createDirectories(UPLOAD_DIR);
        } catch (IOException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Failed to create upload folder");
        }

        List<Path> storedPaths = new ArrayList<>();
        List<Media> saved = new ArrayList<>();
        try {
            for (MultipartFile file : normalized) {
                String extension = getExtension(file.getOriginalFilename());
                if (extension == null) {
                    throw new ResponseStatusException(BAD_REQUEST, "Only .jpg, .png, and .mp4 files are allowed");
                }
                String safeName = UUID.randomUUID() + "." + extension;
                Path target = UPLOAD_DIR.resolve(safeName);
                Files.copy(file.getInputStream(), target);
                storedPaths.add(target);
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
        } catch (IOException ex) {
            cleanupFiles(storedPaths);
            throw new ResponseStatusException(BAD_REQUEST, "Failed to save file");
        } catch (RuntimeException ex) {
            cleanupFiles(storedPaths);
            throw ex;
        }
    }

    public List<MediaResponse> getByBlog(Long blogId) {
        return mediaRepo.findByBlogIdBlog(blogId).stream()
                .map(this::toResponse)
                .toList();
    }

    public MediaResponse getFirstByBlog(Long blogId) {
        Media media = mediaRepo.findFirstByBlogIdBlogOrderByIdAsc(blogId);
        if (media == null) {
            throw new ResponseStatusException(NOT_FOUND, "Media not found");
        }
        return toResponse(media);
    }

    public void deleteByBlog(Long blogId) {
        List<Media> mediaList = mediaRepo.findByBlogIdBlog(blogId);
        if (mediaList.isEmpty()) {
            return;
        }
        mediaRepo.deleteAll(mediaList);
        for (Media media : mediaList) {
            deleteStoredFile(media.getUrl());
        }
    }

    public void deleteMedia(Long mediaId) {
        Media media = mediaRepo.findById(mediaId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Media not found"));
        mediaRepo.delete(media);
        deleteStoredFile(media.getUrl());
    }

    public List<MultipartFile> normalizeOptional(List<MultipartFile> files) {
        return normalizeFiles(files, false);
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> files, boolean required) {
        if (files == null || files.isEmpty()) {
            if (required) {
                throw new ResponseStatusException(BAD_REQUEST, "No files uploaded");
            }
            return List.of();
        }

        List<MultipartFile> nonEmpty = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                nonEmpty.add(file);
            }
        }

        if (nonEmpty.isEmpty()) {
            if (required) {
                throw new ResponseStatusException(BAD_REQUEST, "No files uploaded");
            }
            return List.of();
        }

        if (nonEmpty.size() > MAX_FILES) {
            throw new ResponseStatusException(BAD_REQUEST, "Maximum 5 files allowed");
        }

        long totalSize = 0L;
        for (MultipartFile file : nonEmpty) {
            totalSize += file.getSize();
        }
        if (totalSize > MAX_TOTAL_BYTES) {
            throw new ResponseStatusException(BAD_REQUEST, "Total media size exceeds 10MB");
        }

        for (MultipartFile file : nonEmpty) {
            validateFileType(file);
        }

        return nonEmpty;
    }

    private void validateFileType(MultipartFile file) {
        String contentType = file.getContentType();
        String extension = getExtension(file.getOriginalFilename());

        if (contentType == null || extension == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Only .jpg, .png, and .mp4 files are allowed");
        }

        String normalizedMimeType = contentType.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
        boolean allowedMimeType = ALLOWED_MIME_TYPES.contains(normalizedMimeType);
        boolean allowedExtension = ALLOWED_EXTENSIONS.contains(extension);
        if (!allowedMimeType || !allowedExtension) {
            throw new ResponseStatusException(BAD_REQUEST, "Only .jpg, .png, and .mp4 files are allowed");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return null;
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private void cleanupFiles(List<Path> storedPaths) {
        for (Path path : storedPaths) {
            try {
                Files.deleteIfExists(path);
            } catch (IOException ignored) {
                // Best-effort cleanup.
            }
        }
    }

    private void deleteStoredFile(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        String filename = extractFilename(url);
        if (filename == null || filename.isBlank()) {
            return;
        }
        Path uploadRoot = UPLOAD_DIR.toAbsolutePath().normalize();
        Path target = uploadRoot.resolve(filename).normalize();
        if (!target.startsWith(uploadRoot)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Best-effort cleanup.
        }
    }

    private String extractFilename(String url) {
        try {
            String path = new URI(url).getPath();
            if (path == null) {
                return null;
            }
            return Paths.get(path).getFileName().toString();
        } catch (URISyntaxException ignored) {
            int slash = url.lastIndexOf('/');
            if (slash < 0 || slash == url.length() - 1) {
                return null;
            }
            return url.substring(slash + 1);
        }
    }

    private MediaResponse toResponse(Media media) {
        return new MediaResponse(
                media.getId(),
                media.getBlog() == null ? null : media.getBlog().getIdBlog(),
                media.getUrl(),
                media.getMediaType(),
                media.getCreatedAt()
        );
    }
}
