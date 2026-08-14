"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, staggerContainer } from "./variants";

interface StaggerGroupProps {
    children: ReactNode;
    className?: string;
    stagger?: number;
    delayChildren?: number;
    once?: boolean;
    amount?: number;
}

export function StaggerGroup({
    children,
    className,
    stagger = 0.12,
    delayChildren = 0,
    once = true,
    amount = 0.2,
}: StaggerGroupProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            variants={staggerContainer(stagger, delayChildren)}
        >
            {children}
        </motion.div>
    );
}

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
    children: ReactNode;
    className?: string;
    variants?: Variants;
}

export function StaggerItem({ children, className, variants = fadeUp, ...rest }: StaggerItemProps) {
    return (
        <motion.div className={className} variants={variants} {...rest}>
            {children}
        </motion.div>
    );
}
