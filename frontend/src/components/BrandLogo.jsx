import PropTypes from "prop-types";

const sizeClasses = {
  xs: {
    mark: "size-6",
    text: "text-xs",
  },
  sm: {
    mark: "size-9",
    text: "text-[15px]",
  },
  md: {
    mark: "size-12",
    text: "text-2xl",
  },
};

const BrandLogo = ({ showText = false, size = "md", className = "" }) => {
  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className={`flex-shrink-0 ${classes.mark}`}
        aria-hidden="true"
        focusable="false"
      >
        <rect width="64" height="64" rx="16" className="fill-primary" />
        <path
          d="M16 17h32c5.5 0 10 4.2 10 9.4v13.2c0 5.2-4.5 9.4-10 9.4H34.9l-9.5 7.2c-1.7 1.3-4.1.1-4.1-2.1V49H16c-5.5 0-10-4.2-10-9.4V26.4C6 21.2 10.5 17 16 17Z"
          className="fill-primary-content"
        />
        <path
          d="M20.5 27.5 31.9 39 43.5 27.5"
          fill="none"
          className="stroke-primary"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 39v7.5"
          fill="none"
          className="stroke-primary"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
        <circle cx="50" cy="14" r="7" className="fill-success stroke-base-100" strokeWidth="3" />
      </svg>

      {showText && (
        <span className={`truncate font-bold tracking-normal text-base-content ${classes.text}`}>
          Yaroo
        </span>
      )}
    </span>
  );
};

BrandLogo.propTypes = {
  className: PropTypes.string,
  showText: PropTypes.bool,
  size: PropTypes.oneOf(["xs", "sm", "md"]),
};

export default BrandLogo;
