export default function GradientButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-2xl px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
