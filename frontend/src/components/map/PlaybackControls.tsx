import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    progress: number; // 0 to 100
    onSeek: (value: number) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    currentTime?: string;
}

export function PlaybackControls({
    isPlaying,
    onPlayPause,
    progress,
    onSeek,
    speed,
    onSpeedChange,
    currentTime,
}: PlaybackControlsProps) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-4 shadow-xl z-[1000] animate-in slide-in-from-bottom-5">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm text-foreground/80">
                    <span className="font-mono">{currentTime || '--:--'}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-primary">Route Playback</span>
                </div>

                <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={(vals) => onSeek(vals[0])}
                    className="cursor-pointer"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPlayPause()}
                            className="h-10 w-10 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                        </Button>

                        <Select value={speed.toString()} onValueChange={(v) => onSpeedChange(Number(v))}>
                            <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-glass-border">
                                <SelectValue placeholder="Speed" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1x</SelectItem>
                                <SelectItem value="5">5x</SelectItem>
                                <SelectItem value="10">10x</SelectItem>
                                <SelectItem value="50">50x</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {progress.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
}
