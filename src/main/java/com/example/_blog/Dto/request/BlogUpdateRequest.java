package com.example._blog.Dto.request;

import com.example._blog.Entity.enums.BlogStatus;

import jakarta.validation.constraints.Size;

public record BlogUpdateRequest(
        String title,
        @Size(max = 1000) String content,
        String media,
        BlogStatus status
) {
}
