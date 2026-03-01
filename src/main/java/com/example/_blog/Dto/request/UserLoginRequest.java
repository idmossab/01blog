package com.example._blog.Dto.request;

import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(
        @NotBlank String emailOrUsername,
        @NotBlank String password
) {
}
