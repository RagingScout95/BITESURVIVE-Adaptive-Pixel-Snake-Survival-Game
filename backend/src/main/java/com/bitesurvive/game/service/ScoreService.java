package com.bitesurvive.game.service;

import com.bitesurvive.game.dto.ScoreInput;
import com.bitesurvive.game.entity.Score;
import com.bitesurvive.game.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ScoreService {
    
    @Autowired
    private ScoreRepository scoreRepository;
    
    @Transactional
    public Score submitScore(ScoreInput input) {
        Score score = new Score();
        score.setPlayerName(input.getPlayerName() != null && !input.getPlayerName().trim().isEmpty() 
            ? input.getPlayerName() : "Anonymous");
        score.setScore(input.getScore());
        score.setTimeSurvived(input.getTimeSurvived());
        score.setMaxSnakeLength(input.getMaxSnakeLength());
        score.setDifficultyReached(input.getDifficultyReached());
        
        return scoreRepository.save(score);
    }
    
    public List<Score> getLeaderboard() {
        Pageable pageable = PageRequest.of(0, 10);
        return scoreRepository.findTop10ByOrderByScoreDesc(pageable);
    }
}

