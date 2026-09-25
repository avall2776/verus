"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Download, FastForward, RotateCcw } from 'lucide-react';

interface VersusAudioPlayerProps {
  src: string;
  downloadName?: string;
  className?: string;
}

export const VersusAudioPlayer: React.FC<VersusAudioPlayerProps> = ({
  src,
  downloadName = 'audio_versus.ogg',
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  // Formata segundos para MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Alterna Play / Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('[Audio Player] Erro ao reproduzir:', err);
      });
    }
  }, [isPlaying]);

  // Alterna velocidade (1x -> 1.5x -> 2x -> 1x)
  const cyclePlaybackRate = useCallback(() => {
    if (!audioRef.current) return;
    let nextRate: 1 | 1.5 | 2 = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    setPlaybackRate(nextRate);
    audioRef.current.playbackRate = nextRate;
  }, [playbackRate]);

  // Interação na barra de progresso (Click / Seek)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickPos / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Atualiza tempo de áudio
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Pausa o áudio ao desmontar o componente
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Porcentagem atual
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-2xl bg-[#0B1224] border border-slate-800/90 shadow-lg text-white select-none ${className}`}
    >
      {/* Elemento de áudio nativo oculto */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        className="hidden"
      >
        <source src={src} type="audio/ogg" />
        <source src={src} type="audio/mp4" />
        <source src={src} type="audio/mpeg" />
      </audio>

      {/* Linha Principal de Controles */}
      <div className="flex items-center gap-3">
        {/* Botão Play / Pause Fluido */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer shrink-0"
          title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          {isPlaying ? (
            <Pause size={18} className="fill-current text-white" />
          ) : (
            <Play size={18} className="fill-current text-white ml-0.5" />
          )}
        </button>

        {/* Trilha e Barra de Progresso Interativa */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="relative h-2 w-full bg-slate-800/90 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-hidden group/bar"
            title="Clique para avançar ou retroceder"
          >
            {/* Barra preenchida com gradiente monocromático ciano/azul do VERSUS */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all group-hover/bar:brightness-125"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Marcador deslizante de posição */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_6px_rgba(0,0,0,0.6)] opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          {/* Timers de Reprodução */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Botão Seletor de Velocidade (1x, 1.5x, 2x) */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-cyan-500/50 text-[11px] font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shrink-0"
          title="Alterar velocidade de reprodução"
        >
          {playbackRate}x
        </button>

        {/* Botão de Download */}
        <a
          href={src}
          download={downloadName}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
          title="Baixar áudio"
        >
          <Download size={14} />
        </a>
      </div>
    </div>
  );
};

export default VersusAudioPlayer;
