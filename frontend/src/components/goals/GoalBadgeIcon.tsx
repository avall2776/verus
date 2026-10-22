import React from "react";
import { 
  Trophy, Gem, Zap, Rocket, Target, Star, Award, Crown, Medal 
} from "lucide-react";

interface GoalBadgeIconProps {
  icon: string;
  className?: string;
}

export function GoalBadgeIcon({ icon, className = "w-4 h-4" }: GoalBadgeIconProps) {
  const normalized = (icon || "").toLowerCase().trim();
  
  if (normalized === "trophy" || normalized === "🏆") {
    return <Trophy className={`${className} text-amber-400`} />;
  }
  if (normalized === "gem" || normalized === "💎") {
    return <Gem className={`${className} text-cyan-400`} />;
  }
  if (normalized === "zap" || normalized === "⚡") {
    return <Zap className={`${className} text-amber-400`} />;
  }
  if (normalized === "rocket" || normalized === "🚀") {
    return <Rocket className={`${className} text-blue-400`} />;
  }
  if (normalized === "target" || normalized === "🎯") {
    return <Target className={`${className} text-purple-400`} />;
  }
  if (normalized === "star" || normalized === "⭐") {
    return <Star className={`${className} text-emerald-400`} />;
  }
  if (normalized === "crown" || normalized === "🥇") {
    return <Crown className={`${className} text-amber-400`} />;
  }
  if (normalized === "medal" || normalized === "🥈") {
    return <Medal className={`${className} text-slate-300`} />;
  }
  if (normalized === "award" || normalized === "🥉") {
    return <Award className={`${className} text-orange-400`} />;
  }
  
  return <Award className={`${className} text-blue-400`} />;
}
