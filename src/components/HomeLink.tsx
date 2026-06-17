"use client";

import type { MouseEvent, ReactNode } from "react";

type HomeLinkProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function goHomeWithReload() {
  window.location.assign("/");
}

export function HomeLink({ children, className, title }: HomeLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    goHomeWithReload();
  };

  return (
    <a href="/" title={title} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
