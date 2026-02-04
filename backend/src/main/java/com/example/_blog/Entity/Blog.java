package com.example._blog.Entity;

import java.time.Instant;

import com.example._blog.Entity.enums.BlogStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "blogs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String content;
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private BlogStatus status = BlogStatus.ACTIVE;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "media")
    private String media;
    @Builder.Default
    private Long commentCount = 0L;
    @Builder.Default
    private Long likeCount = 0L;
    @Builder.Default
    private Instant createdAt = Instant.now();
    private Instant updatedAt;

}
