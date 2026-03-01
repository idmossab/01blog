package com.example._blog.Service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.util.List;

import com.example._blog.Dto.response.AuthResponse;
import com.example._blog.Dto.request.UserLoginRequest;
import com.example._blog.Dto.request.UserRegisterRequest;
import com.example._blog.Dto.response.UserResponse;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.CommentRepo;
import com.example._blog.Repositories.FollowRepo;
import com.example._blog.Repositories.LikeRepo;
import com.example._blog.Repositories.NotificationRepo;
import com.example._blog.Repositories.ReportRepo;
import com.example._blog.Repositories.UserRepo;
import com.example._blog.Security.JwtService;

@Service
public class UserService {
    private final UserRepo repo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final BlogRepo blogRepo;
    private final CommentRepo commentRepo;
    private final LikeRepo likeRepo;
    private final FollowRepo followRepo;
    private final NotificationRepo notificationRepo;
    private final ReportRepo reportRepo;
    private final MediaService mediaService;

    public UserService(UserRepo repo, PasswordEncoder encoder, JwtService jwtService, BlogRepo blogRepo,
                       CommentRepo commentRepo, LikeRepo likeRepo, FollowRepo followRepo,
                       NotificationRepo notificationRepo, ReportRepo reportRepo, MediaService mediaService) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.blogRepo = blogRepo;
        this.commentRepo = commentRepo;
        this.likeRepo = likeRepo;
        this.followRepo = followRepo;
        this.notificationRepo = notificationRepo;
        this.reportRepo = reportRepo;
        this.mediaService = mediaService;
    }

    // REGISTER
    public AuthResponse register(UserRegisterRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new ResponseStatusException(CONFLICT, "Email already used");
        }
        if (repo.existsByUserName(req.userName())) {
            throw new ResponseStatusException(CONFLICT, "Username already used");
        }
        boolean isFirstUser = repo.count() == 0;

        User user = User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .userName(req.userName())
                .email(req.email())
                .password(encoder.encode(req.password()))
                .role(isFirstUser ? UserRole.ADMIN : UserRole.USER)
                .build();

        // INSERT
        User saved = repo.save(user);
        return new AuthResponse(jwtService.generateToken(saved), toResponse(saved));
    }

    // LOGIN (email OR username)
    public AuthResponse login(UserLoginRequest req) {
        User u = repo.findByEmail(req.emailOrUsername());
        if (u == null) {
            u = repo.findByUserName(req.emailOrUsername());
        }
        if (u == null) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }
        if (u.getStatus() == UserStatus.BANNED) {
            throw new ResponseStatusException(FORBIDDEN, "Your account is banned");
        }
        if (u.getStatus() == UserStatus.DELETED) {
            throw new ResponseStatusException(FORBIDDEN, "Your account is not active");
        }

        if (!encoder.matches(req.password(), u.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Wrong password");
        }

        return new AuthResponse(jwtService.generateToken(u), toResponse(u));
    }

    public List<UserResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse getById(Long userId) {
        return toResponse(repo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found")));
    }

    public UserResponse update(Long userId, UserRegisterRequest req) {
        User existing = repo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (!existing.getEmail().equals(req.email()) && repo.existsByEmail(req.email())) {
            throw new ResponseStatusException(CONFLICT, "Email already used");
        }
        if (!existing.getUserName().equals(req.userName()) && repo.existsByUserName(req.userName())) {
            throw new ResponseStatusException(CONFLICT, "Username already used");
        }

        existing.setFirstName(req.firstName());
        existing.setLastName(req.lastName());
        existing.setUserName(req.userName());
        existing.setEmail(req.email());
        existing.setPassword(encoder.encode(req.password()));

        return toResponse(repo.save(existing));
    }

    @Transactional
    public void delete(Long userId) {
        User existing = repo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        List<Long> userBlogIds = blogRepo.findByUserUserId(userId).stream()
                .map((blog) -> blog.getIdBlog())
                .toList();

        for (Long blogId : userBlogIds) {
            reportRepo.deleteByBlogIdBlog(blogId);
            notificationRepo.deleteByBlogIdBlog(blogId);
            likeRepo.deleteByBlogIdBlog(blogId);
            commentRepo.deleteByBlogIdBlog(blogId);
            mediaService.deleteByBlog(blogId);
        }

        likeRepo.deleteByUserUserId(userId);
        commentRepo.deleteByUserUserId(userId);
        followRepo.deleteByFollowerUserIdOrFollowingUserId(userId, userId);
        notificationRepo.deleteByRecipientUserIdOrActorUserId(userId, userId);
        reportRepo.deleteByReporterUserIdOrReportedUserUserId(userId, userId);

        if (!userBlogIds.isEmpty()) {
            blogRepo.deleteAllById(userBlogIds);
        }
        repo.delete(existing);
    }

    public UserResponse updateStatus(Long userId, UserStatus status) {
        User existing = repo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        existing.setStatus(status);
        return toResponse(repo.save(existing));
    }

    public UserResponse updateRole(Long userId, UserRole role) {
        User existing = repo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        User superAdmin = repo.findFirstByRoleOrderByUserIdAsc(UserRole.ADMIN);
        if (superAdmin != null && superAdmin.getUserId().equals(existing.getUserId())) {
            throw new ResponseStatusException(FORBIDDEN, "Super admin role cannot be changed");
        }
        existing.setRole(role);
        return toResponse(repo.save(existing));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getUserName(),
                user.getEmail(),
                user.getStatus(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
