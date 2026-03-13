export const fadeIn = () => {
  return {
    hidden: {
      y: 80,
      opacity: 0,
      x: 0,
      transition: {
        type: 'tween' as const,
        duration: 0.5,
        delay: 0.5,
        ease: [0.25, 0.6, 0.3, 0.8] as [number, number, number, number],
      },
    },
    visible: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween' as const,
        duration: 1.4,
        delay: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75] as [number, number, number, number],
      },
    },
  };
};
