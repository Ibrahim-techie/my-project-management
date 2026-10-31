import { motion, useReducedMotion } from "motion/react";

/**
 * Fades children up the first time they scroll into view, then stays put.
 * Pass `index` to stagger items in a grid. Does nothing for reduced motion.
 */
export function Reveal({ children, index = 0, className, as = "div" }) {
  const still = useReducedMotion();
  const Comp = motion[as];
  if (still) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05, ease: "easeOut" }}
    >
      {children}
    </Comp>
  );
}
