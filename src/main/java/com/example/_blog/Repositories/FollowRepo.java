package com.example._blog.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Follow;

@Repository
public interface FollowRepo extends JpaRepository<Follow, Long> {
    boolean existsByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);
    void deleteByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);

    @Query("select f.following.userId from Follow f where f.follower.userId = :followerId")
    List<Long> findFollowingIdsByFollowerId(@Param("followerId") Long followerId);
}
