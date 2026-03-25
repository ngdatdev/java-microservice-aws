package com.demo.master.controller;

import com.demo.master.entity.Category;
import com.demo.master.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/master")
@RequiredArgsConstructor
public class MasterController {

    private final CategoryRepository categoryRepository;
    private final WebClient memberWebClient;
    private final WebClient fileWebClient;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @GetMapping("/dashboard")
    public Mono<ResponseEntity<Map<String, Object>>> getDashboard() {
        Mono<List> members = memberWebClient.get().uri("/api/v1/members").retrieve().bodyToMono(List.class).onErrorReturn(List.of());
        Mono<List> files = fileWebClient.get().uri("/api/v1/files").retrieve().bodyToMono(List.class).onErrorReturn(List.of());

        return Mono.zip(members, files).map(tuple -> {
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("memberCount", tuple.getT1().size());
            dashboard.put("fileCount", tuple.getT2().size());
            dashboard.put("categories", categoryRepository.count());
            return ResponseEntity.ok(dashboard);
        });
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("UP");
    }
}
