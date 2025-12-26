package com.bitesurvive.game.resolver;

import com.bitesurvive.game.dto.ScoreInput;
import com.bitesurvive.game.entity.Score;
import com.bitesurvive.game.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class ScoreResolver {
    
    @Autowired
    private ScoreService scoreService;
    
    @MutationMapping
    public Score submitScore(@Argument ScoreInput input) {
        return scoreService.submitScore(input);
    }
    
    @QueryMapping
    public List<Score> getLeaderboard() {
        return scoreService.getLeaderboard();
    }
}

