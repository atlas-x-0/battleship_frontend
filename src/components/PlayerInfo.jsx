import React from 'react';

export const PlayerInfo = ({
  _,
  hitsbyPlayer,
  hitsByComputer,
  startAgain,
  winner,
}) => {
  // Calculate player's hit statistics and accuracy
  let numberOfHits = hitsbyPlayer.length;
  let numberOfSuccessfulHits = hitsbyPlayer.filter((hit) => hit.type === 'hit').length;
  let accuracyScore = Math.round(100 * (numberOfSuccessfulHits / numberOfHits));
  let succesfulComputerHits = hitsByComputer.filter((hit) => hit.type === 'hit').length;

  // Game over panel to show the winner and restart button
  let gameOverPanel = (
    <div>
      <div className="tip-box-title">Game Over!</div>
      <p className="player-tip">
        {winner === 'player' ? 'You win! 🎉' : 'You lose 😭.'}
      </p>
      <button className="btn btn-danger" onClick={startAgain}>
        Restart
      </button>
    </div>
  );

  // Statistics panel shown during gameplay
  let tipsPanel = (
    <div>
      <div className="tip-box-title">Stats</div>
      <div id="firing-info">
        <p>Accuracy: {accuracyScore > 0 ? `${accuracyScore}%` : `0%`}</p>
        <button className="btn btn-danger" onClick={startAgain}>
          Restart
        </button>
      </div>
    </div>
  );

  return (
    <div id="player-tips">
      {numberOfSuccessfulHits === 17 || succesfulComputerHits === 17
        ? gameOverPanel
        : tipsPanel}
    </div>
  );
};
