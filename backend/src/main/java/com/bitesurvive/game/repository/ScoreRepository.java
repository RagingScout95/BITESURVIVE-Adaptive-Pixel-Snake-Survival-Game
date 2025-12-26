package com.bitesurvive.game.repository;

import com.bitesurvive.game.entity.Score;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    @Query("SELECT s FROM Score s ORDER BY s.score DESC, s.timeSurvived DESC, s.difficultyReached DESC")
    List<Score> findTop10ByOrderByScoreDesc(Pageable pageable);
    
    List<Score> findAllByOrderByScoreDescTimeSurvivedDesc();
}

