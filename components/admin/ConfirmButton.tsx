'use client';

import type { ReactNode } from 'react';

/** ক্লিক করলে আগে জিজ্ঞেস করে; "না" বললে form পাঠানো হয় না */
export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
