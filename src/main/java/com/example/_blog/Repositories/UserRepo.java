package com.example._blog.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.UserRole;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {
    User findByUserName(String userName);
    User findByEmail(String email);

    boolean existsByUserName(String userName);
    boolean existsByEmail(String email);

    User findFirstByRoleOrderByUserIdAsc(UserRole role);
}
