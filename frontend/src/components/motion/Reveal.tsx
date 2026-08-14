"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./variants";

interface RevealProps {
    children: ReactNode;
    className?: string;
    variants?: Variants;
    delay?: number;
    once?: boolean;
    amount?: number;
    as?: "div" | "section";
}

export default function Reveal({
    children,
    className,
    variants = fadeUp,
    delay = 0,
    once = true,
    amount = 0.25,
    as = "div",
}: RevealProps) {
    const Component = as === "section" ? motion.section : motion.div;
    return (
        <Component
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            variants={variants}
            transition={{ delay }}
        >
            {children}
        </Component>
    );
}
