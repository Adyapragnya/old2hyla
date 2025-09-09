import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "./MultiSelectDropdown.css";
import DropdownPortal from "./DropdownPortal";

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  setSelected,
  placeholder,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const controlRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      const isInsideContainer = containerRef.current?.contains(event.target);
      const isInsideDropdown = dropdownRef.current?.contains(event.target);
      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateDropdownPosition = useCallback(() => {
    if (!controlRef.current) return;
    const rect = controlRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 2147483647,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
      window.addEventListener("scroll", calculateDropdownPosition, true);
      window.addEventListener("resize", calculateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", calculateDropdownPosition, true);
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen, calculateDropdownPosition]);

  const toggleOption = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const removeTag = (id, e) => {
    e.stopPropagation();
    setSelected((prev) => prev.filter((s) => s !== id));
  };

  const selectAll = () => {
    setSelected(options.map((opt) => opt.id));
  };

  const clearAll = () => {
    setSelected([]);
  };

  const handleKeyDown = (e) => {
    const items = containerRef.current?.querySelectorAll(".option-item");
    const currentIndex = Array.from(items || []).findIndex(
      (item) => item === document.activeElement
    );
    if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault();
      const next = items[(currentIndex + 1) % items.length];
      next?.focus();
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      const prev = items[(currentIndex - 1 + items.length) % items.length];
      prev?.focus();
    }
  };

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`multi-select-container ${isOpen ? "open" : ""}`}
      ref={containerRef}
    >
      <label className="multi-select-label">{label}</label>

      <div
        className="multi-select-control"
        tabIndex={0}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          calculateDropdownPosition();
        }}
        onKeyDown={handleKeyDown}
        ref={controlRef}
      >
      
      <div className="selected-tags">
  {selected.length === 0 && (
    <div className="multi-select-placeholder">{placeholder}</div>
  )}

  {options
    .filter((o) => selected.includes(o.id))
    .slice(0, 2)
    .map((option) => (
      <div
        key={option.id}
        className="selected-tag"
        title={option.label}
      >
        <span title={option.label}>{option.label}</span>
        <button
          aria-label={`Remove ${option.label}`}
          onClick={(e) => removeTag(option.id, e)}
        >
          &times;
        </button>
      </div>
    ))}

  {selected.length > 2 && (
    <div
      className="selected-tag more-tag"
      title={`${selected.length - 2} more selected`}
    >
      +{selected.length - 2} more
    </div>
  )}
</div>


      </div>

      {isOpen && (
        <DropdownPortal>
          <div
            ref={dropdownRef}
            className="options-list"
            style={dropdownStyle}
            role="listbox"
            aria-multiselectable="true"
          >
            {/* Search input */}
            <input
              type="text"
              className="dropdown-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            {/* Select/Clear actions */}
            <div className="dropdown-actions">
              <button type="button" onClick={selectAll}>Select All</button>
              <button type="button" onClick={clearAll}>Clear</button>
            </div>

            {/* Option items */}
            {filteredOptions.length === 0 && (
              <div className="option-item no-options" tabIndex={-1}>
                No matching options
              </div>
            )}
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                role="option"
                aria-selected={selected.includes(option.id)}
                tabIndex={0}
                className={`option-item ${
                  selected.includes(option.id) ? "selected" : ""
                }`}
                onClick={() => toggleOption(option.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleOption(option.id);
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}

MultiSelectDropdown.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  selected: PropTypes.array.isRequired,
  setSelected: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

MultiSelectDropdown.defaultProps = {
  placeholder: "Select...",
};
