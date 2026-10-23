"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal: Renderiza modais diretamente no <body> da aplicação
 * evitando que cabeçalhos (Topbar), barras laterais (Sidebar/VALLOR)
 * ou containers ancestrais com z-index/overflow cortem o desfoque de fundo.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export default ModalPortal;
