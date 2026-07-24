'use client';

interface WoodblockTextureProps {
  className?: string;
}

export function WoodblockTexture({ className = '' }: WoodblockTextureProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}
