const SimpleBackground = () => {
  return (
    <>
      {/* Simple Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 -z-20" />
      
      {/* Animated Gradient Overlay */}
      <div className="fixed inset-0 opacity-40 -z-19">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20" 
             style={{ 
               backgroundSize: '400% 400%',
               animation: 'gradientShift 8s ease-in-out infinite'
             }} />
      </div>

      {/* Simple floating shapes */}
      <div className="fixed inset-0 overflow-hidden -z-18">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-60 right-20 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: '6s' }} />
      </div>
    </>
  );
};

export default SimpleBackground;