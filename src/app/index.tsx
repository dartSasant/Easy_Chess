import { GameScreen } from '@/ui/game/gameScreen';

export default function Index() {
  // Temporary: test mode lets one phone play both sides.
  return <GameScreen localColor="w" testMode />;
}