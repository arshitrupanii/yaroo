import PropTypes from "prop-types";

const getInitial = (name, username, email) => {
  const source = name || username || email || "Y";
  return source.trim().charAt(0).toUpperCase();
};

const AvatarInitials = ({
  user,
  src,
  alt = "User",
  className = "size-10",
  textClassName = "text-sm",
  showStatus = false,
  isOnline = false,
}) => {
  const imageSrc = src || user?.profilePicture;
  const label = alt || user?.firstname || user?.username || user?.email || "User";
  const initial = getInitial(user?.firstname, user?.username, user?.email);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={label}
          className="h-full w-full rounded-full border border-base-300 object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary ${textClassName}`}>
          {initial}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-base-100 ${
            isOnline ? "bg-success" : "bg-base-content/25"
          }`}
        />
      )}
    </div>
  );
};

AvatarInitials.propTypes = {
  user: PropTypes.shape({
    firstname: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    profilePicture: PropTypes.string,
  }),
  src: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  textClassName: PropTypes.string,
  showStatus: PropTypes.bool,
  isOnline: PropTypes.bool,
};

export default AvatarInitials;
