package com.bitesurvive.game.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreInput {
    private String playerName;
    private Integer score;
    private Integer timeSurvived;
    private Integer maxSnakeLength;
    private Integer difficultyReached;
}

