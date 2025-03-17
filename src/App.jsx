import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from './game/config'
import './App.css'

function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create game instance
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: 'game-container'
      });

      // Cleanup
      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, []);

  return (
    <div className="App">
      <div id="game-container"></div>
    </div>
  );
}

export default App;
