const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');

  body {
    font-family: 'Montserrat', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .page-transition-enter { opacity: 0; }
  .page-transition-enter-active {
    opacity: 1;
    transition: opacity 500ms ease-out;
  }
  .page-transition-exit { opacity: 1; }
  .page-transition-exit-active {
    opacity: 0;
    transition: opacity 500ms ease-in;
  }

  .fade-in { animation: fadeIn 1s forwards; }
  @keyframes fadeIn { to { opacity: 1; } }

  .hero-text-fade {
    opacity: 0;
    transform: translateY(10px);
    animation: heroTextFade 1s forwards ease-out;
  }
  @keyframes heroTextFade {
    to { opacity: 1; transform: translateY(0); }
  }

  .backdrop-filter {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
`;

export default globalStyles;
