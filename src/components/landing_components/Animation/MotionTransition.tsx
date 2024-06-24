import { fadeIn } from '@/lib/transitions';
import { MotionTransitionProps } from '@/types/types';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

function MotionTransition(props: MotionTransitionProps) {
  const { children, className } = props;
  const ref = useRef(null);

  const isInView = useInView(ref, { once: false });
  const mainControls = useAnimation();
  const sideControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start('visible');
      sideControls.start('visible');
    } else {
      mainControls.start('hidden');
      sideControls.start('hidden');
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <div ref={ref}>
      <motion.div variants={fadeIn()} initial="hidden" animate={mainControls} exit="hidden" className={className}>
        {children}
      </motion.div>
    </div>
  );
}

export default MotionTransition;
