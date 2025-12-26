// GraphQL API Client
import { Debug } from './debug.js';

const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';

export class GameAPI {
    static async submitScore(scoreData) {
        const mutation = `
            mutation SubmitScore($input: ScoreInput!) {
                submitScore(input: $input) {
                    id
                    playerName
                    score
                    timeSurvived
                    maxSnakeLength
                    difficultyReached
                    createdAt
                }
            }
        `;

        const variables = {
            input: {
                playerName: scoreData.playerName || 'Anonymous',
                score: scoreData.score,
                timeSurvived: scoreData.timeSurvived,
                maxSnakeLength: scoreData.maxSnakeLength,
                difficultyReached: scoreData.difficultyReached
            }
        };

        try {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: mutation,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data.submitScore;
        } catch (error) {
            Debug.error('Error submitting score:', error);
            throw error;
        }
    }

    static async getLeaderboard() {
        const query = `
            query GetLeaderboard {
                getLeaderboard {
                    id
                    playerName
                    score
                    timeSurvived
                    maxSnakeLength
                    difficultyReached
                    createdAt
                }
            }
        `;

        try {
            const response = await fetch(GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data.getLeaderboard;
        } catch (error) {
            Debug.error('Error fetching leaderboard:', error);
            throw error;
        }
    }
}

