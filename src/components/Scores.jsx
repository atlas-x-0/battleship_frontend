import React, { useEffect, useState } from 'react';
import { Table, Container, Alert, Spinner } from 'react-bootstrap';
import { getAllGamesAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const Scores = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHighScores = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 获取所有已完成的游戏
        const games = await getAllGamesAPI({ status_filter: 'Completed' });
        
        // 计算每个用户的胜负场次
        const statsMap = {};
        
        for (const game of games) {
          if (!game.winner) continue;
          
          // 获取获胜者和失败者信息
          const winnerId = game.winner._id || game.winner;
          const winnerName = game.winner.username || 'Unknown';
          
          // 确定输家ID和名称
          let loserId = null;
          let loserName = 'Unknown';
          
          if (game.player1 && (game.player1._id === winnerId || game.player1 === winnerId)) {
            loserId = game.player2 ? (game.player2._id || game.player2) : null;
            loserName = game.player2 ? (game.player2.username || 'Unknown') : 'Unknown';
          } else {
            loserId = game.player1 ? (game.player1._id || game.player1) : null;
            loserName = game.player1 ? (game.player1.username || 'Unknown') : 'Unknown';
          }
          
          // 更新获胜者统计
          if (winnerId) {
            if (!statsMap[winnerId]) {
              statsMap[winnerId] = { id: winnerId, username: winnerName, wins: 0, losses: 0 };
            }
            statsMap[winnerId].wins++;
          }
          
          // 更新失败者统计
          if (loserId) {
            if (!statsMap[loserId]) {
              statsMap[loserId] = { id: loserId, username: loserName, wins: 0, losses: 0 };
            }
            statsMap[loserId].losses++;
          }
        }
        
        // 转换为数组并按要求排序
        const sortedStats = Object.values(statsMap).sort((a, b) => {
          if (a.wins !== b.wins) return b.wins - a.wins; // 胜场数降序
          if (a.losses !== b.losses) return a.losses - b.losses; // 败场数升序
          return a.username.localeCompare(b.username); // 用户名字母顺序
        });
        
        setUserStats(sortedStats);
      } catch (err) {
        console.error("Failed to fetch high scores:", err);
        setError(err.message || "Could not load high scores data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighScores();
  }, []);

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border">
          <span className="visually-hidden">Loading high scores...</span>
        </Spinner>
        <p>Loading high scores...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">High Scores</h1>
      {userStats.length === 0 ? (
        <Alert variant="info">No completed games found. Play some games to see scores here!</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="bg-dark text-white">
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {userStats.map((player, index) => (
              <tr 
                key={player.id} 
                className={user && user.id === player.id ? 'table-primary' : ''}
              >
                <td>{index + 1}</td>
                <td>
                  {user && user.id === player.id ? (
                    <strong>{player.username} (You)</strong>
                  ) : (
                    player.username
                  )}
                </td>
                <td>{player.wins}</td>
                <td>{player.losses}</td>
                <td>
                  {player.wins + player.losses > 0 
                    ? `${((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%` 
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Scores;
