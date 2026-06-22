import PropTypes from 'prop-types';
import { Box, Card, CardContent, CardMedia, Chip, Grid, Stack, Typography } from '@mui/material';
import { IconPhotoOff } from '@tabler/icons-react';

const IMAGE_TYPE_LABELS = {
  full: 'Full frame',
  plate: 'Plate crop',
  annotated: 'Annotated'
};

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function EvidenceCard({ imageType, image }) {
  const label = IMAGE_TYPE_LABELS[imageType] ?? imageType;
  const hasPreview = Boolean(image?.previewUrl);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      {hasPreview ? (
        <CardMedia
          component="img"
          image={image.previewUrl}
          alt={`${label} evidence`}
          sx={{ height: 200, objectFit: 'cover', bgcolor: 'grey.100' }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack spacing={1} alignItems="center" sx={{ px: 2, textAlign: 'center' }}>
            <IconPhotoOff size={36} stroke={1.25} opacity={0.5} />
            <Typography variant="body2" color="text.secondary">
              Preview unavailable
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Evidence path is stored as metadata and may not be browser-loadable.
            </Typography>
          </Stack>
        </Box>
      )}

      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">{label}</Typography>
            <Chip size="small" label={imageType} variant="outlined" />
          </Stack>

          {image ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                Path: {image.filePath ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Size: {formatFileSize(image.fileSize)} · Resolution: {image.resolution ?? '—'}
              </Typography>
              {image.expiresAt ? (
                <Typography variant="caption" color="text.secondary">
                  Expires: {image.expiresAt}
                </Typography>
              ) : null}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No {label.toLowerCase()} image registered for this event.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

EvidenceCard.propTypes = {
  imageType: PropTypes.string.isRequired,
  image: PropTypes.object
};

export default function AnprEvidenceGallery({ images = [], imageMap = {} }) {
  const orderedTypes = ['full', 'plate', 'annotated'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Evidence gallery
      </Typography>
      <Grid container spacing={2}>
        {orderedTypes.map((imageType) => {
          const image = imageMap[imageType] ?? images.find((item) => item.imageType === imageType) ?? null;
          return (
            <Grid key={imageType} size={{ xs: 12, md: 4 }}>
              <EvidenceCard imageType={imageType} image={image} />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

AnprEvidenceGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.object),
  imageMap: PropTypes.object
};
