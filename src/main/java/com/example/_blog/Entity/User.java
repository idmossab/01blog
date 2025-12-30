package com.example._blog.Entity;


import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    @Column(nullable=false)
    private String firstName;
    @Column(nullable=false)
    private String lastName;
    @Column(nullable = false, unique = true)
    private String userName;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    private String bio;
    private String avatar;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status=UserStatus.ACTIVE;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role=UserRole.USER;
}