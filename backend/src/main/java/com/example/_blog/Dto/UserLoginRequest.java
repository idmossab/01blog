package com.example._blog.Dto;

import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(
        @NotBlank String emailOrUsername,
        @NotBlank String password
) {
}
