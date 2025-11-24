const CallButton = ({
  icon: Icon,
  onClick,
  color,
  label,
  active = true,
  disabled = false,
}) => {
  const baseStyle =
    "p-3 sm:p-4 rounded-full transition-all duration-300 shadow-xl";
  const activeColor = color;
  const inactiveColor = "bg-gray-600";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 flex flex-col items-center justify-center cursor-pointer ${baseStyle} 
                            ${active ? activeColor : inactiveColor} 
                            ${
                              disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:scale-110 active:scale-90"
                            }`}
      title={label}
    >
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
    </button>
  );
};

export default CallButton;
