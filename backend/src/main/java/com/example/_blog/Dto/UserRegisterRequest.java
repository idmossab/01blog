package com.example._blog.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String userName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password
) {
}
