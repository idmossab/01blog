package com.example._blog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import com.example._blog.Entity.Media;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.MediaRepo;
import com.example._blog.Repositories.UserRepo;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class BlogMediaIntegrationTests {
    private static final Path UPLOAD_DIR = Paths.get("uploads");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private BlogRepo blogRepo;

    @Autowired
    private MediaRepo mediaRepo;

    private final List<Path> createdPaths = new ArrayList<>();

    @AfterEach
    void cleanup() throws IOException {
        for (Path path : createdPaths) {
            Files.deleteIfExists(path);
        }
        createdPaths.clear();
        mediaRepo.deleteAll();
        blogRepo.deleteAll();
        userRepo.deleteAll();
    }

    @Test
    void createBlogWithMediaSucceedsWhenTotalSizeUnderLimit() throws Exception {
        User user = createUser();
        MockMultipartFile file = new MockMultipartFile(
                "files",
                "image.png",
                "image/png",
                new byte[1024 * 1024]
        );

        mockMvc.perform(
                multipart("/blogs/with-media")
                        .file(file)
                        .param("userId", user.getUserId().toString())
                        .param("title", "Hello")
                        .param("content", "World")
                        .param("status", "ACTIVE")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idBlog").isNumber());

        assertEquals(1, blogRepo.count());
        assertEquals(1, mediaRepo.count());

        List<Media> mediaList = mediaRepo.findAll();
        for (Media media : mediaList) {
            String url = media.getUrl();
            String filename = url.substring(url.lastIndexOf('/') + 1);
            Path path = UPLOAD_DIR.resolve(filename);
            assertTrue(Files.exists(path));
            createdPaths.add(path);
        }
    }

    @Test
    void createBlogWithMediaFailsWhenTotalSizeExceedsLimit() throws Exception {
        User user = createUser();
        List<String> before = listUploadFiles();

        MockMultipartFile file1 = new MockMultipartFile(
                "files",
                "big1.png",
                "image/png",
                new byte[6 * 1024 * 1024]
        );
        MockMultipartFile file2 = new MockMultipartFile(
                "files",
                "big2.png",
                "image/png",
                new byte[6 * 1024 * 1024]
        );

        mockMvc.perform(
                multipart("/blogs/with-media")
                        .file(file1)
                        .file(file2)
                        .param("userId", user.getUserId().toString())
                        .param("title", "Too big")
                        .param("content", "This should fail")
                        .param("status", "ACTIVE")
        )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Total media size exceeds 10MB"));

        assertEquals(0, blogRepo.count());
        assertEquals(0, mediaRepo.count());

        List<String> after = listUploadFiles();
        assertEquals(before, after);
    }

    private User createUser() {
        User user = User.builder()
                .firstName("Test")
                .lastName("User")
                .userName("testuser" + System.nanoTime())
                .email("test" + System.nanoTime() + "@example.com")
                .password("password")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .build();
        return userRepo.save(user);
    }

    private List<String> listUploadFiles() throws IOException {
        if (!Files.exists(UPLOAD_DIR)) {
            return List.of();
        }
        try (Stream<Path> stream = Files.list(UPLOAD_DIR)) {
            return stream
                    .map(path -> path.getFileName().toString())
                    .sorted()
                    .collect(Collectors.toList());
        }
    }
}
