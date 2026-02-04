package com.example._blog.Service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import com.example._blog.Dto.UserLoginRequest;
import com.example._blog.Dto.UserRegisterRequest;
import com.example._blog.Dto.UserResponse;
import com.example._blog.Entity.User;
import com.example._blog.Repositories.UserRepo;

@Service
public class UserService {
    private final UserRepo repo;
    private final PasswordEncoder encoder;
    public UserService(UserRepo repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    // REGISTER
    public UserResponse register(UserRegisterRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new ResponseStatusException(CONFLICT, "Email already used");
        }
        if (repo.existsByUserName(req.userName())) {
            throw new ResponseStatusException(CONFLICT, "Username already used");
        }

        User user = User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .userName(req.userName())
                .email(req.email())
                .password(encoder.encode(req.password()))
                .build();

        // INSERT
        return toResponse(repo.save(user));
    }

    // LOGIN (email OR username)
    public UserResponse login(UserLoginRequest req) {
        User u = repo.findByEmail(req.emailOrUsername());
        if (u == null) {
            u = repo.findByUserName(req.emailOrUsername());
        }
        if (u == null) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }

        if (!encoder.matches(req.password(), u.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Wrong password");
        }

        return toResponse(u);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUserName(),
                user.getEmail(),
                user.getStatus(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
