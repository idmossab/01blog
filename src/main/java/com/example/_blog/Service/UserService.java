package com.example._blog.Service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example._blog.Entity.User;
import com.example._blog.Repositories.UserRepo;

@Service
public class UserService {
    private final UserRepo repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    public UserService(UserRepo repo, PasswordEncoder encoder) {
        this.repo = repo;
    }

    // REGISTER
    public User register(User user) {
        if (repo.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already used");
        }
        if (repo.existsByUserName(user.getUserName())) {
            throw new RuntimeException("Username already used");
        }

        // hash password before save
        user.setPassword(encoder.encode(user.getPassword()));

        // INSERT
        return repo.save(user);
    }

    // LOGIN (email OR username)
    public User login(String emailOrUsername, String rawPassword) {
        User u = repo.findByEmail(emailOrUsername);
        if (u == null) {
            u = repo.findByUserName(emailOrUsername);
        }
        if (u == null) {
            throw new RuntimeException("User not found");
        }

        if (!encoder.matches(rawPassword, u.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        return u;
    }
}
