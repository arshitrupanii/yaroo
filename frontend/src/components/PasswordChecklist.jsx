import { CheckCircle2, Circle } from "lucide-react";
import PropTypes from "prop-types";
import { getPasswordChecks } from "../lib/authValidation";

const PasswordChecklist = ({ password }) => {
  const checks = getPasswordChecks(password);

  return (
    <div className="grid grid-cols-1 gap-2 text-xs text-base-content/60 min-[360px]:grid-cols-2">
      {checks.map((check) => {
        const Icon = check.passed ? CheckCircle2 : Circle;

        return (
          <div
            key={check.id}
            className={check.passed ? "flex items-center gap-1.5 text-success" : "flex items-center gap-1.5"}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{check.label}</span>
          </div>
        );
      })}
    </div>
  );
};

PasswordChecklist.propTypes = {
  password: PropTypes.string.isRequired,
};

export default PasswordChecklist;
