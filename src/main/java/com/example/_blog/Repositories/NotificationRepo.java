package com.example._blog.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Notification;

@Repository
public interface NotificationRepo extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId, Pageable pageable);
    List<Notification> findByRecipientUserIdAndIsReadFalse(Long recipientUserId);
    long countByRecipientUserIdAndIsReadFalse(Long recipientUserId);
    Optional<Notification> findByIdAndRecipientUserId(Long id, Long recipientUserId);
    void deleteByBlogIdBlog(Long blogId);
}
