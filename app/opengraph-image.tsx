// app/opengraph-image.tsx

import { ImageResponse } from 'next/og';

export const alt = 'ReportPilot - Marketing Reporting for Agencies';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#a3e635',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#09090b',
              fontWeight: 800,
              fontSize: '22px',
              marginRight: '16px',
            }}
          >
            RP
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '36px',
              fontWeight: 800,
              color: '#f4f4f5',
              letterSpacing: '-0.02em',
            }}
          >
            Report<span style={{ color: '#a3e635' }}>Pilot</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex' }}>Client reports,</div>
            <div style={{ display: 'flex' }}>
              without the{' '}
              <span style={{ color: '#a3e635', marginLeft: '16px' }}>deck</span>.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '26px',
              color: '#a1a1aa',
              maxWidth: '850px',
              lineHeight: 1.4,
            }}
          >
            One dashboard for every client. Live ad spend, leads, and tokenized client portals.
          </div>
        </div>

        {/* Footer info bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid #27272a',
            paddingTop: '28px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '20px', color: '#71717a' }}>
            Multi-Client Dashboards • Google & Meta Ads • Real-time Portals
          </div>
          <div
            style={{
              display: 'flex',
              background: '#a3e635',
              color: '#09090b',
              padding: '12px 28px',
              borderRadius: '9999px',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Start Free
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
