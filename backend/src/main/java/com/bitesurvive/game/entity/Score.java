package com.bitesurvive.game.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Score {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String playerName;
    
    @Column(nullable = false)
    private Integer score;
    
    @Column(nullable = false)
    private Integer timeSurvived;
    
    @Column(nullable = false)
    private Integer maxSnakeLength;
    
    @Column(nullable = false)
    private Integer difficultyReached;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

