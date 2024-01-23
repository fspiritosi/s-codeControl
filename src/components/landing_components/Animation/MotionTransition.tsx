import { MotionTransitionProps} from '@/types/types'
import { useEffect, useRef } from 'react'
import { useInView, useAnimation, motion } from 'framer-motion'
import { fadeIn } from '@/lib/transitions'

function MotionTransition(props: MotionTransitionProps) {
    const {children, className} = props
    const ref = useRef(null)

    const isInView = useInView(ref, {once: false});
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
    },[isInView])


    return (
    <div ref={ref}>
        <motion.div
            variants={fadeIn()}
            initial="hidden"
            animate={mainControls}
            exit='hidden'
            className={className}

        >
            {children}
        </motion.div>
    </div>
  )
}

export default MotionTransition