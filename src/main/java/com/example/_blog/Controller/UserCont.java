package com.example._blog.Controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Service.UserService;

import jakarta.websocket.server.PathParam;


@RestController
@RequestMapping("users")
public class UserCont {

    private final UserService userService;

    public UserCont(UserService userService) {
        this.userService = userService;
    }

    @DeleteMapping
    public void deleteUser(@PathParam("userId") long  userId) {
        // Implementation for deleting a user by userId
        System.out.println("Deleting user with ID: " + userId);
        userService.deleteUserById(userId);
    }

    @PostMapping
    public String postMethodName(@RequestBody String entity) {      
        System.out.println("Received entity: " + entity);  
        return entity;
    }
    

}
