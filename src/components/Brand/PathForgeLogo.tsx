export function PathForgeLogo() {
  return (
    <div className="pathforge-logo" role="img" aria-label="PathForge">
      <svg
        className="pathforge-logo__svg"
        viewBox="0 0 56 56"
        aria-hidden="true"
        focusable="false"
      >
        <g className="pathforge-logo__graph">
          <path d="M12 43V22L28 12L44 22" />
          <path d="M12 43L29 34L44 22" />
        </g>

        <g className="pathforge-logo__neutral-nodes">
          <circle cx="12" cy="43" r="3.25" />
          <circle cx="12" cy="22" r="3.25" />
          <circle cx="28" cy="12" r="3.25" />
          <circle cx="29" cy="34" r="3.25" />
          <circle cx="44" cy="22" r="3.25" />
        </g>

        <g className="pathforge-logo__active-path">
          <path
            className="pathforge-logo__route"
            d="M12 43L21 34H29L37 25L44 22L48 15"
            pathLength="1"
          />
          <circle className="pathforge-logo__active-node pathforge-logo__start" cx="12" cy="43" r="3.5" />
          <circle className="pathforge-logo__active-node pathforge-logo__middle" cx="29" cy="34" r="3.5" />
          <circle className="pathforge-logo__active-node pathforge-logo__destination" cx="44" cy="22" r="3.5" />
          <path className="pathforge-logo__arrow" d="M51.5 10.5L42.5 13.6L47 16.8Z" />
        </g>
      </svg>
    </div>
  );
}
