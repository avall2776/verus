"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, Download, FastForward, RotateCcw, Forward } from 'lucide-react';

interface VersusAudioPlayerProps {
  src: string;
  downloadName?: string;
  className?: string;
  isOutbound?: boolean;
  timestamp?: string;
  statusNode?: React.ReactNode;
  onForward?: () => void;
}

export const VersusAudioPlayer: React.FC<VersusAudioPlayerProps> = ({
  src,
  downloadName = 'audio_vallor.ogg',
  className = '',
  isOutbound = false,
  timestamp,
  statusNode,
  onForward,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  const isLeroBrokenUrl = Boolean(src && src.includes('lvdphjhftfjdifnzuazd.supabase.co'));
  const [hasError, setHasError] = useState(isLeroBrokenUrl);

  useEffect(() => {
    const isBroken = Boolean(src && src.includes('lvdphjhftfjdifnzuazd.supabase.co'));
    setHasError(isBroken);
    if (!isBroken) {
      setIsLoading(false);
    }
  }, [src]);

  // Formata segundos para MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Alterna Play / Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || isLeroBrokenUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasError(false);
      }).catch((err) => {
        console.warn('[Audio Player] Erro ao reproduzir:', err);
      });
    }
  }, [isPlaying, isLeroBrokenUrl]);

  // Alterna velocidade (1x -> 1.5x -> 2x -> 1x)
  const cyclePlaybackRate = useCallback(() => {
    if (!audioRef.current || hasError) return;
    let nextRate: 1 | 1.5 | 2 = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    setPlaybackRate(nextRate);
    audioRef.current.playbackRate = nextRate;
  }, [playbackRate, hasError]);

  // Interação na barra de progresso (Click / Seek)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration || hasError) return;
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
      setHasError(false);
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

  if (hasError) {
    return (
      <div className={`vallor-media-item ${isOutbound ? 'vallor-msg-outbound' : 'vallor-msg-inbound'} flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl select-none shadow-sm ${
        isOutbound 
          ? 'bg-[#DBEAFE] dark:bg-[#1C325E] border border-blue-200/90 dark:border-sky-400/20 text-slate-900 dark:text-white' 
          : 'bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-700/50 text-slate-800 dark:text-slate-100'
      } ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Volume2 size={16} className={`shrink-0 ${isOutbound ? 'text-blue-600 dark:text-cyan-400' : 'text-amber-500 dark:text-amber-400'}`} />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate leading-tight">Áudio histórico indisponível</span>
            <span className="text-[10px] opacity-75 truncate leading-tight">Armazenamento do CRM anterior desativado</span>
          </div>
        </div>
        {(timestamp || statusNode) && (
          <span className="inline-flex items-center gap-1 text-[11px] opacity-75 shrink-0 self-end leading-none ml-1">
            {timestamp && <span>{timestamp}</span>}
            {statusNode}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`vallor-media-item ${isOutbound ? 'vallor-msg-outbound' : 'vallor-msg-inbound'} flex flex-col gap-1.5 px-3.5 py-2.5 rounded-2xl select-none shadow-sm ${
        isOutbound
          ? 'bg-[#DBEAFE] dark:bg-[#1C325E] border border-blue-200/90 dark:border-sky-400/20 text-slate-900 dark:text-white'
          : 'bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-700/50 text-slate-800 dark:text-slate-100'
      } ${className}`}
    >
      {/* Elemento de áudio nativo */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => {
          setIsLoading(false);
          if (isLeroBrokenUrl) {
            setHasError(true);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* Linha Principal de Controles */}
      <div className="flex items-center gap-2.5">
        {/* Botão Play / Pause Fluido */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 flex items-center justify-center text-white shadow-sm transition-all cursor-pointer shrink-0"
          title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          {isPlaying ? (
            <Pause size={16} className="fill-current text-white" />
          ) : (
            <Play size={16} className="fill-current text-white ml-0.5" />
          )}
        </button>

        {/* Trilha e Barra de Progresso Interativa */}
        <div className="flex-1 flex flex-col justify-center gap-1 pt-1">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="relative h-1.5 w-full hover:h-2 rounded-full cursor-pointer transition-all overflow-hidden group/bar bg-slate-300/70 dark:bg-slate-950/60"
            title="Clique para avançar ou retroceder"
          >
            {/* Barra preenchida com gradiente monocromático ciano/azul do Vallor */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all group-hover/bar:brightness-125"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Marcador deslizante de posição */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 5px)` }}
            />
          </div>

          {/* Timers de Reprodução + Horário da Mensagem */}
          <div className="flex items-center justify-between text-[10px] font-mono opacity-80 leading-none pt-0.5">
            <span>{isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}</span>
            <span className="inline-flex items-center gap-1 font-sans">
              {timestamp && <span>{timestamp}</span>}
              {statusNode}
            </span>
          </div>
        </div>

        {/* Botão Seletor de Velocidade (1x, 1.5x, 2x) */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 bg-black/10 dark:bg-black/25 hover:bg-black/20 dark:hover:bg-black/40"
          title="Alterar velocidade de reprodução"
        >
          {playbackRate}x
        </button>

        {/* Botão de Encaminhar Áudio */}
        {onForward && (
          <button
            type="button"
            onClick={onForward}
            className="p-1.5 rounded-full transition-all cursor-pointer shrink-0 bg-black/10 dark:bg-black/25 hover:bg-black/20 dark:hover:bg-black/40 opacity-80 hover:opacity-100 hover:text-blue-500 dark:hover:text-cyan-400"
            title="Encaminhar áudio"
          >
            <Forward size={13} />
          </button>
        )}

        {/* Botão de Download */}
        <a
          href={src}
          download={downloadName}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full transition-all cursor-pointer shrink-0 bg-black/10 dark:bg-black/25 hover:bg-black/20 dark:hover:bg-black/40 opacity-80 hover:opacity-100"
          title="Baixar áudio"
        >
          <Download size={13} />
        </a>
      </div>
    </div>
  );
};

export default VersusAudioPlayer;
