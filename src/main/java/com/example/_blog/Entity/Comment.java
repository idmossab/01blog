package com.example._blog.Entity;


import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "comments")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false,length=10000)
    private String content;
    @ManyToOne
    @JoinColumn(name = "blog_id", nullable = false)
    private Blog blog;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Builder.Default
    private Instant createdAt=Instant.now();
    private Instant updatedAt;
}
