"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console so you can see the real error in devtools
    console.error("[GlobalError]", error.message, error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — MENUZA AI</title>
        {/* Load the app stylesheet so design tokens are available */}
        <link rel="stylesheet" href="/_next/static/css/app/layout.css" />
        {/* Inline fallback styles in case the CSS chunk isn't available */}
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:system-ui,sans-serif;background:#fcf9f8;color:#1c1b1a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}
          .card{max-width:28rem;width:100%;text-align:center}
          .icon{font-size:3.5rem;color:#ba1a1a;margin-bottom:1.25rem;display:block;font-family:'Material Symbols Outlined',sans-serif;font-style:normal}
          h1{font-size:1.75rem;font-weight:800;margin-bottom:.75rem}
          p{color:#6b6560;margin-bottom:2rem;line-height:1.6}
          .digest{font-size:.7rem;color:#aaa;margin-top:.5rem;font-family:monospace}
          .btns{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center}
          button,a{display:inline-block;padding:.75rem 2rem;border-radius:.75rem;font-weight:700;cursor:pointer;text-decoration:none;font-size:.9rem;transition:opacity .15s}
          button{background:#ff6b00;color:#fff;border:none}
          a{background:#ede8e4;color:#1c1b1a}
          button:hover,a:hover{opacity:.85}
        `}</style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap" />
      </head>
      <body>
        <div className="card">
          <span className="icon" aria-hidden="true">error</span>
          <h1>Something went wrong</h1>
          <p>
            An unexpected error occurred. Our team has been notified.
            {error.digest && <span className="digest">Error ID: {error.digest}</span>}
          </p>
          <div className="btns">
            <button onClick={reset}>Try Again</button>
            <a href="/">Go Home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
