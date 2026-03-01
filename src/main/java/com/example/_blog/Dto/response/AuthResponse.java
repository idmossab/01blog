package com.example._blog.Dto.response;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
