// ================= Feature Card ==================
"use client";
import React from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color?: "black" | "red" | "gold";
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => {
  // German flag colors
  const bgColors = {
    black: "bg-black",
    red: "bg-red-600",
    gold: "bg-yellow-400",
  };

  const textColors = {
    black: "text-black",
    red: "text-red-600",
    gold: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="group p-8 rounded-xl shadow-xl transform transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl relative overflow-hidden cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
    >
      {/* Hover background tint */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${bgColors[color ?? "gold"]}`}
      ></div>

      <Icon
        className={`w-16 h-16 mx-auto mb-6 relative z-10 ${textColors[color ?? "gold"]}`}
      />

      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 relative z-10">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-300 relative z-10">
        {description}
      </p>
    </motion.div>
  );
};

export default FeatureCard;
