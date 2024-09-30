import { Button } from '@/components/ui/button';
import { PauseIcon, PlayIcon } from 'lucide-react';

interface PomodoroTimerProps {
  isPomodoro: boolean;
  pomodoroTime: number;
  pomodoroRef: React.MutableRefObject<NodeJS.Timeout | null>;
  toggleTimer: (taskId: number) => void;
  formatTime: (seconds: number) => string;
}

export default function PomodoroTimer({ isPomodoro, pomodoroTime, pomodoroRef, toggleTimer, formatTime }: PomodoroTimerProps) {
  if (!isPomodoro) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Pomodoro Timer</h3>
      <div className="text-2xl font-mono mb-2">{formatTime(pomodoroTime)}</div>
      <Button onClick={() => toggleTimer(0)}>
        {pomodoroRef.current ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />}
        {pomodoroRef.current ? 'Pause' : 'Start'}
      </Button>
    </div>
  );
}
