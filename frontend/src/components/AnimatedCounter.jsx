import { useEffect, useState } from 'react';

export function AnimatedCounter({ end = 0, duration = 1800, suffix = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let startTime = null;

    const animate = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.round(progress * end));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [duration, end]);

  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
