package com.example._blog.Dto.response;

import java.time.Instant;
import java.util.List;

import com.example._blog.Entity.enums.BlogStatus;

public record BlogResponse(
        Long idBlog,
        String title,
        String content,
        BlogStatus status,
        Long userId,
        String userName,
        String userFirstName,
        String userLastName,
        String media,
        Long commentCount,
        Long likeCount,
        Instant createdAt,
        Instant updatedAt,
        List<MediaResponse> mediaFiles
) {
}
