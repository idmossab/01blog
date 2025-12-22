package com.example._blog.Service;

import org.springframework.stereotype.Service;

import com.example._blog.Repositories.UserRepo;

@Service
public class UserService {
    private final UserRepo userRepo;

    public UserService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }


    public void deleteUserById(Long userId) {
        userRepo.deleteUserById(userId);
    }
}
