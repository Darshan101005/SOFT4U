import { ImageResponse } from 'next/og';

// Favicon: the "4" of the Soft4u wordmark on a pistachio tile.
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#93C572',
          borderRadius: 14,
          color: '#2B3328',
          fontSize: 46,
          fontWeight: 800,
        }}
      >
        4
      </div>
    ),
    size,
  );
}
