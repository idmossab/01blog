package com.example._blog.Dto.request;

import com.example._blog.Entity.enums.BlogStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlogCreateRequest(
        @NotBlank String title,
        @NotBlank @Size(max = 1000) String content,
        BlogStatus status
) {
}
