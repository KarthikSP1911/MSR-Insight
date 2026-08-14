import type { Variants, Transition } from "framer-motion";

export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: EASE_OUT },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { duration: 0.8, ease: EASE_OUT },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.94, y: 16 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE_OUT },
    },
};

export const staggerContainer = (stagger = 0.12, delayChildren = 0): Variants => ({
    hidden: {},
    show: {
        transition: {
            staggerChildren: stagger,
            delayChildren,
        },
    },
});
