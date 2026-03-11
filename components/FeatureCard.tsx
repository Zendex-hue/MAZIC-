import React from "react";
import { motion } from "motion/react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorFrom: string;
  colorTo: string;
  shadowColor: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  onClick,
  colorFrom,
  colorTo,
  shadowColor,
}) => {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ y: 4, scale: 0.98, boxShadow: "0 0px 0 0 rgba(0,0,0,0.8), inset 0 2px 0 0 rgba(255,255,255,0.1)" }}
      onClick={onClick}
      className={`relative w-full aspect-square md:aspect-auto md:h-48 p-4 md:p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-200 bg-gradient-to-br ${colorFrom} ${colorTo} border border-white/20`}
      style={{
        boxShadow: `0 8px 0 0 ${shadowColor}, 0 15px 20px rgba(0,0,0,0.4), inset 0 2px 0 0 rgba(255,255,255,0.3)`
      }}
    >
      <div className="p-3 md:p-4 rounded-2xl bg-white/20 backdrop-blur-md mb-2 md:mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.2)]">
        {icon}
      </div>
      <h3 className="text-sm md:text-lg font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-wide">
        {title}
      </h3>
      <p className="hidden md:block text-xs md:text-sm text-white/90 mt-1 font-medium drop-shadow-md">
        {description}
      </p>
    </motion.button>
  );
};
