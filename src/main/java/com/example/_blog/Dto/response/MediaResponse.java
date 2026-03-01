package com.example._blog.Dto.response;

import java.time.Instant;

public record MediaResponse(
        Long id,
        Long blogId,
        String url,
        String mediaType,
        Instant createdAt
) {
}
