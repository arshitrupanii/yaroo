import PropTypes from "prop-types";
import { MessageCircleMore } from "lucide-react";

const sizeClasses = {
  sm: {
    mark: "size-9 rounded-lg",
    icon: "size-4.5",
    text: "text-[15px]",
    dot: "size-2",
  },
  md: {
    mark: "size-12 rounded-xl",
    icon: "size-6",
    text: "text-2xl",
    dot: "size-2.5",
  },
};

const BrandLogo = ({ showText = true, size = "md", className = "" }) => {
  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        className={`relative flex flex-shrink-0 items-center justify-center border border-primary/20 bg-primary text-primary-content shadow-sm ${classes.mark}`}
        aria-hidden="true"
      >
        <MessageCircleMore className={classes.icon} strokeWidth={2.35} />
        <span className={`absolute -right-0.5 -top-0.5 rounded-full bg-accent ring-2 ring-base-100 ${classes.dot}`} />
      </span>

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
