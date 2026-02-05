package com.example._blog.Entity;

import java.time.Instant;

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
@Table(name = "follows")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Follow {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne
        @JoinColumn(name = "follower_id", nullable = false)
        private User follower;

        @ManyToOne
        @JoinColumn(name = "following_id", nullable = false)
        private User following;

        @Builder.Default
        private Instant createdAt = Instant.now();
}
