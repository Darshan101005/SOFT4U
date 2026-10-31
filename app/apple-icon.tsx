import { ImageResponse } from 'next/og';

// Home-screen icon and the Organization logo in JSON-LD: the Soft4u wordmark on white.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F6FAF1',
          color: '#2B3328',
          fontSize: 50,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        Soft<span style={{ color: '#659642' }}>4</span>u
      </div>
    ),
    size,
  );
}
