import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography
} from '@mui/material';
import { IconPlayerPause, IconPlayerPlay, IconRotateClockwise } from '@tabler/icons-react';

import { MalaysiaTime } from 'ui-component/MalaysiaTime';
import {
  formatReplayAnomalyChip,
  formatReplayCoordinate,
  REPLAY_SPEED_OPTIONS
} from '../utils/patrolReplayUtils';

export default function PatrolReplayControls({
  replayEnabled = true,
  canReplay = false,
  hasEnoughPoints = false,
  routeCount = 0,
  isPlaying = false,
  replayProgress = 0,
  replayTime = null,
  currentRoutePoint = null,
  speedMultiplier = 1,
  replayFinished = false,
  currentSegmentAnomaly = null,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange
}) {
  if (!replayEnabled) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Replay available after patrol is completed.
      </Typography>
    );
  }

  if (routeCount === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No patrol route data available for replay.
      </Typography>
    );
  }

  if (!hasEnoughPoints) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Not enough route points to replay.
      </Typography>
    );
  }

  const anomalyLabel = formatReplayAnomalyChip(currentSegmentAnomaly);

  return (
    <Box sx={{ py: 1 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="small"
            startIcon={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
            onClick={isPlaying ? onPause : onPlay}
            disabled={!canReplay}
          >
            {isPlaying ? 'Pause' : replayFinished ? 'Replay again' : 'Play'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconRotateClockwise size={18} />}
            onClick={onStop}
            disabled={!canReplay}
          >
            Stop
          </Button>
          <FormControl size="small" sx={{ minWidth: 88 }}>
            <InputLabel id="replay-speed-label">Speed</InputLabel>
            <Select
              labelId="replay-speed-label"
              label="Speed"
              value={speedMultiplier}
              onChange={(e) => onSpeedChange?.(e.target.value)}
            >
              {REPLAY_SPEED_OPTIONS.map((speed) => (
                <MenuItem key={speed} value={speed}>
                  {speed}x
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {replayFinished ? (
            <Chip size="small" label="Finished" color="success" variant="outlined" />
          ) : null}
        </Stack>

        <Box sx={{ px: 0.5 }}>
          <Slider
            size="small"
            value={replayProgress}
            min={0}
            max={100}
            step={0.1}
            onChange={(_, value) => onSeek?.(Array.isArray(value) ? value[0] / 100 : value / 100)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(v)}%`}
            disabled={!canReplay}
            aria-label="Replay progress"
          />
        </Box>

        <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap>
          <Typography variant="caption" color="text.secondary">
            Progress: <strong>{Math.round(replayProgress)}%</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Time:{' '}
            <strong>
              {replayTime ? <MalaysiaTime time={replayTime} /> : '—'}
            </strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Position: <strong>{formatReplayCoordinate(currentRoutePoint)}</strong>
          </Typography>
        </Stack>

        {anomalyLabel ? (
          <Chip size="small" color="warning" label={anomalyLabel} sx={{ alignSelf: 'flex-start' }} />
        ) : null}
      </Stack>
    </Box>
  );
}

PatrolReplayControls.propTypes = {
  replayEnabled: PropTypes.bool,
  canReplay: PropTypes.bool,
  hasEnoughPoints: PropTypes.bool,
  routeCount: PropTypes.number,
  isPlaying: PropTypes.bool,
  replayProgress: PropTypes.number,
  replayTime: PropTypes.string,
  currentRoutePoint: PropTypes.object,
  speedMultiplier: PropTypes.number,
  replayFinished: PropTypes.bool,
  currentSegmentAnomaly: PropTypes.object,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onStop: PropTypes.func,
  onSeek: PropTypes.func,
  onSpeedChange: PropTypes.func
};
