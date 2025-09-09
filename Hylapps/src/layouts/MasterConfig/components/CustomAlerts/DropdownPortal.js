import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const portalRoot = document.getElementById("dropdown-portal-root") || (() => {
  const root = document.createElement("div");
  root.id = "dropdown-portal-root";
  document.body.appendChild(root);
  return root;
})();

export default function DropdownPortal({ children }) {
  return createPortal(children, portalRoot);
}

DropdownPortal.propTypes = {
  children: PropTypes.node.isRequired,
};
