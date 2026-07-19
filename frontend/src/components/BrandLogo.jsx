import PropTypes from "prop-types";

const sizeClasses = {
  sm: {
    mark: "size-9",
    text: "text-[15px]",
  },
  md: {
    mark: "size-12",
    text: "text-2xl",
  },
};

const BrandLogo = ({ showText = true, size = "md", className = "" }) => {
  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <img
        src="/yaroo.svg"
        alt=""
        className={`flex-shrink-0 ${classes.mark}`}
        aria-hidden="true"
        draggable="false"
      />

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
  size: PropTypes.oneOf(["sm", "md"]),
};

export default BrandLogo;
