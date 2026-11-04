/** ppp's mark – three hopping p's on pink, as the site's icon. */
const Mark = ({ size }: { size: number }) => (
  <svg aria-hidden height={size} viewBox="0 0 64 64" width={size}>
    <rect fill="#ff5c8a" height="64" rx="16" width="64" />
    <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="4.2">
      <g transform="rotate(-9 14 34)">
        <path d="M9 25v24" />
        <circle cx="14.6" cy="31" r="5.6" />
      </g>
      <g transform="translate(0 -3) rotate(7 31 34)">
        <path d="M26 25v24" />
        <circle cx="31.6" cy="31" r="5.6" />
      </g>
      <g transform="translate(0 1) rotate(-5 48 34)">
        <path d="M43 25v24" />
        <circle cx="48.6" cy="31" r="5.6" />
      </g>
    </g>
  </svg>
);

/** Over the login: the mark and the name. */
export const AdminLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
    <Mark size={56} />
    <span
      style={{
        font: "700 3rem/1 ui-rounded, system-ui, sans-serif",
        letterSpacing: "-0.04em",
      }}
    >
      ppp
    </span>
  </div>
);

/** On top of every admin page. */
export const AdminIcon = () => <Mark size={26} />;
