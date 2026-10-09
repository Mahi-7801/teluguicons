import { useEffect, useRef, useState } from 'react';
import { getSiteUrl } from '../lib/nomineeCampaign';

// Local QR rendering (no third-party image host), so an offline print run or a
// blocked CDN still produces a scannable code. Add-on req. 6.
export default function QrCode({ value, size = 160, className = '', dark = '#0a0a0a', light = '#ffffff', onDataUrl }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value || !canvasRef.current) return undefined;

    import('qrcode').then(({ default: QRCode }) => {
      if (cancelled || !canvasRef.current) return;
      return QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark, light },
      }).then(() => {
        if (cancelled || !onDataUrl) return;
        QRCode.toDataURL(value, {
          width: size * 2,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark, light },
        }).then((url) => {
          if (!cancelled) onDataUrl(url);
        }).catch(() => {});
      });
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [value, size, dark, light, onDataUrl]);

  if (!value) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        role="img"
        aria-label="QR code linking to this nominee's voting page"
        className={`rounded-lg ${className}`}
        style={{ background: light }}
      />
      {failed && (
        <p className="text-[10px] text-white/40 text-center break-all">
          {getSiteUrl().replace(/^https?:\/\//, '')}
          {value.startsWith('/') ? value : ''}
        </p>
      )}
    </>
  );
}
